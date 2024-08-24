const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { Barang, User, LogApproval } = require("./src/models");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const hbs = require("hbs");

// Setup hbs
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "src/views"));

hbs.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper("eq", function (a, b) {
  return a === b;
});

// Connection database
const config = require("./src/config/config.json");
const { Sequelize, QueryTypes } = require("sequelize");
const { stat } = require("fs");
const sequelize = new Sequelize(config.development);

app.use(express.static("src/assets"));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Setup session
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// Middleware untuk mengecek login
function checkLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).send("User not logged in");
  }
  next();
}

function checkRole(roles) {
  return function (req, res, next) {
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).send("Insufficient role");
    }
    next();
  };
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Routes
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Periksa apakah username sudah ada
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.render("register", { error: "Username already exists" });
    }

    // Enkripsi password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat pengguna baru
    await User.create({
      username,
      password: hashedPassword,
      role,
    });

    res.redirect("/login");
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = user; // Simpan user di sesi
      if (user.role === "adm") {
        res.redirect("/inputbarang");
      } else if (user.role === "adm_finishing") {
        res.redirect("/laporanpersediaan");
      } else if (user.role === "kepala_produksi") {
        res.redirect("/kepalagudang");
      } else if (user.role === "manager") {
        res.redirect("/kepalagudang");
      } else {
        res.redirect("/dasboardatasan");
      }
    } else {
      res.render("login", { error: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/inputbarang", checkLogin, checkRole("adm"), async (req, res) => {
  const { kode_barang, nama_barang, ukuran, jenis_barang, jumlah } = req.body;

  try {
    await Barang.create({
      kode_barang,
      nama_barang,
      ukuran,
      jenis_barang,
      jumlah,
    });

    res.redirect("/inputbarang");
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/inputbarang", checkLogin, checkRole("adm"), async (req, res) => {
  try {
    const barang = await Barang.findAll();
    res.render("inputbarang", { barang });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

app.get(
  "/laporanpersediaan",
  checkLogin,
  checkRole("adm_finishing"),
  async (req, res) => {
    try {
      // Mengambil data barang beserta status persetujuan dari kepala produksi, manajer, dan direktur
      const barangList = await Barang.findAll();

      // Format data barang dengan status persetujuan dari ketiga peran
      const formattedData = barangList.map((barang) => {
        return {
          ...barang.dataValues,
          status_kepala_produksi: barang.status_kepala_produksi,
          status_manager: barang.status_manager,
          status_direktur: barang.status_direktur,
        };
      });

      // Kirim data ke template
      res.render("laporanpersediaan", { barang: formattedData });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Error fetching data");
    }
  }
);

app.get(
  "/kepalagudang",
  checkLogin,
  checkRole(["kepala_produksi", "manager", "direktur"]),
  async (req, res) => {
    try {
      // Mendapatkan data barang
      const barang = await Barang.findAll({
        attributes: [
          "id_barang",
          "kode_barang",
          "nama_barang",
          "ukuran",
          "jenis_barang",
          "jumlah",
          "status_manager",
          "status_kepala_produksi",
          "status_direktur",
        ],
      });

      // Mendapatkan role pengguna dari session
      const userRole = req.session.user?.role;
      console.log(barang, userRole);
      res.render("kepalagudang", { barang, userRole });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Error fetching data");
    }
  }
);

app.post(
  "/updateApproval",
  checkLogin,
  checkRole(["kepala_produksi", "manager", "direktur"]),
  async (req, res) => {
    const { id_barang, status } = req.body; // Mengambil status dari body

    // Logging untuk debugging
    console.log("Session User ID:", req.session.user?.id_user);
    console.log("Session User Object:", req.session.user);

    if (!req.session.user || !req.session.user.id_user) {
      console.error("User ID is missing in session");
      return res
        .status(400)
        .send(
          "<script>alert('User is not authenticated'); window.location.href='/kepalagudang';</script>"
        );
    }

    try {
      let updateData = {};

      // Memperbarui kolom yang relevan berdasarkan peran pengguna
      switch (req.session.user.role) {
        case "kepala_produksi":
          updateData.status_kepala_produksi = status;
          break;
        case "manager":
          updateData.status_manager = status;
          break;
        case "direktur":
          updateData.status_direktur = status;
          break;
        default:
          return res
            .status(403)
            .send(
              "<script>alert('You do not have permission to update this item.'); window.location.href='/kepalagudang';</script>"
            );
      }

      // Melakukan update pada tabel Barang
      await Barang.update(updateData, {
        where: { id_barang },
      });

      // Menampilkan alert sukses
      res.send(
        "<script>alert('Status updated successfully'); window.location.href='/kepalagudang';</script>"
      );
    } catch (error) {
      console.error("Error updating status:", error);
      // Menampilkan alert error
      res
        .status(500)
        .send(
          "<script>alert('Internal Server Error'); window.location.href='/';</script>"
        );
    }
  }
);

app.get("/dasboardatasan", checkLogin, (req, res) => {
  res.render("dasboardatasan");
});
