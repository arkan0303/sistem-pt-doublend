const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { Barang, User, LogApproval } = require("./src/models");
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const hbs = require("hbs");
const PDFDocument = require("pdfkit");

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
    return res.redirect("/login");
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

app.get("/", checkLogin, (req, res) => {
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

app.get("/editbarang/:id", checkLogin, checkRole("adm"), async (req, res) => {
  const id = req.params.id;

  try {
    const barang = await Barang.findOne({ where: { id } });
    if (!barang) {
      return res.status(404).send("Barang tidak ditemukan");
    }
    res.render("editbarang", { barang });
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/editbarang", checkLogin, checkRole("adm"), async (req, res) => {
  const { id_barang, kode_barang, nama_barang, ukuran, jenis_barang, jumlah } =
    req.body;

  try {
    await Barang.update(
      { kode_barang, nama_barang, ukuran, jenis_barang, jumlah },
      { where: { id_barang: id_barang } }
    );
    res.redirect("/inputbarang");
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post(
  "/deletebarang/:id_barang",
  checkLogin,
  checkRole("adm"),
  async (req, res) => {
    const id_barang = req.params.id_barang;

    try {
      await Barang.destroy({ where: { id_barang } });
      res.redirect("/inputbarang");
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

app.get(
  "/laporanpersediaan",
  checkLogin,
  checkRole("adm_finishing"),
  async (req, res) => {
    try {
      const barangList = await Barang.findAll();

      const formattedData = barangList.map((barang) => {
        return {
          ...barang.dataValues,
          status_kepala_produksi: barang.status_kepala_produksi,
          status_manager: barang.status_manager,
          status_direktur: barang.status_direktur,
        };
      });
      res.render("laporanpersediaan", { barang: formattedData });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Error fetching data");
    }
  }
);

app.get(
  "/laporanpersediaan/print",
  checkLogin,
  checkRole("adm_finishing"),
  async (req, res) => {
    try {
      const barangList = await Barang.findAll();

      // Buat dokumen PDF
      const doc = new PDFDocument();
      res.setHeader(
        "Content-disposition",
        "attachment; filename=laporan_persediaan.pdf"
      );
      res.setHeader("Content-type", "application/pdf");
      doc.pipe(res);

      // Header
      doc.fontSize(25).text("Laporan Persediaan", { align: "center" });
      doc.moveDown();

      // Isi laporan
      barangList.forEach((barang, index) => {
        doc.fontSize(12).text(`No: ${index + 1}`);
        doc.text(`Kode Barang: ${barang.kode_barang}`);
        doc.text(`Nama Barang: ${barang.nama_barang}`);
        doc.text(`Ukuran: ${barang.ukuran}`);
        doc.text(`Jenis Barang: ${barang.jenis_barang}`);
        doc.text(`Jumlah: ${barang.jumlah}`);
        // Tambahkan status barang
        doc.text(`Status Kepala Produksi: ${barang.status_kepala_produksi}`);
        doc.text(`Status Manager: ${barang.status_manager}`);
        doc.text(`Status Direktur: ${barang.status_direktur}`);
        doc.moveDown();
      });

      // Akhiri dan kirim dokumen PDF
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).send("Error generating PDF");
    }
  }
);

const ExcelJS = require("exceljs");

app.get(
  "/laporanpersediaan/download",
  checkLogin,
  checkRole("adm_finishing"),
  async (req, res) => {
    try {
      const barangList = await Barang.findAll();

      // Buat workbook dan worksheet baru
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Persediaan");

      // Header kolom
      worksheet.columns = [
        { header: "No", key: "no", width: 5 },
        { header: "Kode Barang", key: "kode_barang", width: 15 },
        { header: "Nama Barang", key: "nama_barang", width: 25 },
        { header: "Ukuran", key: "ukuran", width: 10 },
        { header: "Jenis Barang", key: "jenis_barang", width: 20 },
        { header: "Jumlah", key: "jumlah", width: 10 },
        // Tambahkan kolom status barang
        {
          header: "Status Kepala Produksi",
          key: "status_kepala_produksi",
          width: 20,
        },
        { header: "Status Manager", key: "status_manager", width: 20 },
        { header: "Status Direktur", key: "status_direktur", width: 20 },
      ];

      // Isi data
      barangList.forEach((barang, index) => {
        worksheet.addRow({
          no: index + 1,
          kode_barang: barang.kode_barang,
          nama_barang: barang.nama_barang,
          ukuran: barang.ukuran,
          jenis_barang: barang.jenis_barang,
          jumlah: barang.jumlah,
          // Tambahkan status barang
          status_kepala_produksi: barang.status_kepala_produksi,
          status_manager: barang.status_manager,
          status_direktur: barang.status_direktur,
        });
      });

      // Set response header untuk download file Excel
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=laporan_persediaan.xlsx"
      );

      // Kirim file Excel sebagai response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error generating Excel:", error);
      res.status(500).send("Error generating Excel");
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

app.get(
  "/dasboardatasan",
  checkLogin,
  checkRole(["kepala_produksi", "manager", "direktur"]),
  async (req, res) => {
    try {
      // Menghitung total barang
      const totalBarang = await Barang.count();

      // Menghitung jumlah barang yang disetujui
      const disetujui = await Barang.count({
        where: {
          status_kepala_produksi: "approved",
          status_manager: "approved",
          status_direktur: "approved",
        },
      });

      // Menghitung jumlah barang yang ditolak
      const ditolak = await Barang.count({
        where: {
          [Sequelize.Op.or]: [
            { status_kepala_produksi: "rejected" },
            { status_manager: "rejected" },
            { status_direktur: "rejected" },
          ],
        },
      });
      const pending = await Barang.count({
        where: {
          [Sequelize.Op.or]: [
            { status_kepala_produksi: "pending" },
            { status_manager: "pending" },
            { status_direktur: "pending" },
          ],
        },
      });

      res.render("dasboardatasan", { totalBarang, disetujui, ditolak });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Tambahkan route untuk logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Error logging out");
    }
    res.redirect("/login");
  });
});
