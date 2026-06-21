
// Blokir akses jika belum login ATAU jika bukan admin
var isLoggedIn = sessionStorage.getItem('isLoggedIn');
var userDataStr = sessionStorage.getItem('userData');

var token = sessionStorage.getItem('authToken');
if (isLoggedIn !== 'true' || !userDataStr || !token) {
    document.documentElement.style.display = 'none';
    if (typeof SCRIPT_URL !== 'undefined' && SCRIPT_URL) {
        window.top.location.href = SCRIPT_URL + "?page=login";
    } else if (typeof google !== 'undefined' && google.script) {
        google.script.run.withSuccessHandler(function (url) {
            window.top.location.href = url + "?page=login";
        }).getScriptUrl();
    } else {
        window.location.href = "login.html";
    }
} else {
    var userCheck = JSON.parse(userDataStr);
    var roleCheck = (userCheck.role || userCheck.jabatan || "").toLowerCase();

    // Proteksi: Hanya boleh masuk jika role mengandung 'admin'
    if (!roleCheck.includes('admin') && !roleCheck.includes('super admin')) {
        document.documentElement.style.display = 'none';
        alert("Akses Ditolak! Halaman ini khusus untuk Admin.");
        if (typeof SCRIPT_URL !== 'undefined' && SCRIPT_URL) {
            window.top.location.href = SCRIPT_URL + "?page=Index";
        } else if (typeof google !== 'undefined' && google.script) {
            google.script.run.withSuccessHandler(function (url) {
                window.top.location.href = url + "?page=Index";
            }).getScriptUrl();
        } else {
            window.location.href = "Index.html";
        }
    }

    // HIDE MENU DAFTAR ADMIN JIKA BUKAN SUPER ADMIN
    window.addEventListener('DOMContentLoaded', function () {
        var isSuperAdmin = roleCheck.includes('super admin') || roleCheck.includes('superadmin');
        if (!isSuperAdmin) {
            var menuAdmin = document.getElementById('menuAdmin');
            if (menuAdmin) {
                menuAdmin.style.display = 'none';
            }
            var btnTambahUser = document.getElementById('btnTambahUser');
            if (btnTambahUser) {
                btnTambahUser.style.display = 'none';
            }
        }
    });
}


function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, function (tag) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag);
    });
}

window.addEventListener('DOMContentLoaded', event => {
    // Konfigurasi Navigasi Sidebar
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
        });
    }

    // Elemen Navigasi & Section
    const menus = {
        dashboard: document.getElementById('menuDashboard'),
        manajemen: document.getElementById('menuManajemen'),
        pendataan: document.getElementById('menuPendataan'),
        users: document.getElementById('menuUsers'),
        admin: document.getElementById('menuAdmin'),
        profil: document.getElementById('menuProfil')
    };

    const sections = {
        dashboard: document.getElementById('sectionDashboard'),
        manajemen: document.getElementById('sectionManajemen'),
        pendataan: document.getElementById('sectionPendataan'),
        users: document.getElementById('sectionUsers'),
        admin: document.getElementById('sectionAdmin'),
        profil: document.getElementById('sectionProfil')
    };

    // Fungsi untuk mengganti tampilan halaman
    function switchView(targetKey) {
        Object.keys(sections).forEach(key => {
            if (key === targetKey) {
                sections[key].classList.remove('d-none');
                menus[key].classList.add('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                sections[key].classList.add('d-none');
                menus[key].classList.remove('active');
            }
        });

        if (targetKey === 'pendataan') {
            if (typeof loadDaftarForm === 'function') {
                loadDaftarForm();
            }
        } else if (targetKey === 'users') {
            if (typeof loadDataUsersPaginated === 'function') {
                loadDataUsersPaginated();
            }
        } else if (targetKey === 'admin') {
            if (typeof loadDataAdminPaginated === 'function') {
                loadDataAdminPaginated();
            }
        }
    }

    // Event Listener Menu
    menus.dashboard.addEventListener('click', (e) => { e.preventDefault(); switchView('dashboard'); });
    menus.manajemen.addEventListener('click', (e) => { e.preventDefault(); switchView('manajemen'); });
    menus.pendataan.addEventListener('click', (e) => { e.preventDefault(); switchView('pendataan'); });
    menus.users.addEventListener('click', (e) => { e.preventDefault(); switchView('users'); });
    menus.admin.addEventListener('click', (e) => { e.preventDefault(); switchView('admin'); });
    menus.profil.addEventListener('click', (e) => { e.preventDefault(); switchView('profil'); });

    // Muat Profil User
    var userDataStr = sessionStorage.getItem('userData');
    if (userDataStr) {
        try {
            var user = JSON.parse(userDataStr);

            document.getElementById('navbarUserName').innerText = user.nama || "Admin";
            document.getElementById('profilNama').innerText = user.nama || "Admin";
            document.getElementById('profilJabatan').innerText = (user.jabatan || "-").toUpperCase();

            document.getElementById('editNama').value = user.nama || "";
            document.getElementById('profilUsername').value = user.username || user.npsn || "";

            // Muat semua pengajuan untuk dashboard admin
            loadSemuaPengajuan();

        } catch (e) {
            console.error("Gagal memparsing data user:", e);
        }
    }

    // Form Update Akun
    document.getElementById('formPengaturanAkun').addEventListener('submit', function (e) {
        e.preventDefault();

        var username = document.getElementById('profilUsername').value;
        var newName = document.getElementById('editNama').value;
        var oldPass = document.getElementById('oldPassword').value;
        var newPass = document.getElementById('newPassword').value;
        var confirmPass = document.getElementById('confirmPassword').value;
        var errText = document.getElementById('passwordError');

        var isChangingPassword = oldPass !== "" || newPass !== "" || confirmPass !== "";

        if (isChangingPassword) {
            if (!oldPass || !newPass || !confirmPass) {
                Swal.fire('Perhatian', 'Harap lengkapi seluruh form password!', 'warning');
                return;
            }
            if (newPass !== confirmPass) {
                errText.classList.remove('d-none');
                return;
            } else {
                errText.classList.add('d-none');
            }
        }

        var btn = document.getElementById('btnSimpanAkun');
        var originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Menyimpan...';

        if (typeof google !== 'undefined' && google.script) {
            google.script.run
                .withSuccessHandler(function (nameResponse) {
                    if (nameResponse.success) {
                        var userStr = sessionStorage.getItem('userData');
                        if (userStr) {
                            var userObj = JSON.parse(userStr);
                            userObj.nama = nameResponse.newName;
                            sessionStorage.setItem('userData', JSON.stringify(userObj));
                        }
                        document.getElementById('profilNama').innerText = nameResponse.newName;
                        document.getElementById('navbarUserName').innerText = nameResponse.newName;

                        if (isChangingPassword) {
                            google.script.run
                                .withSuccessHandler(function (passResponse) {
                                    btn.disabled = false;
                                    btn.innerHTML = originalText;
                                    if (passResponse.success) {
                                        document.getElementById('oldPassword').value = '';
                                        document.getElementById('newPassword').value = '';
                                        document.getElementById('confirmPassword').value = '';
                                        Swal.fire('Pembaruan Berhasil!', 'Profil dan Password diperbarui. Silakan login ulang.', 'success')
                                            .then(() => logoutApp());
                                    } else {
                                        Swal.fire('Gagal!', passResponse.message, 'error');
                                    }
                                })
                                .withFailureHandler(function (error) {
                                    btn.disabled = false;
                                    btn.innerHTML = originalText;
                                    Swal.fire('Error Sistem', 'Profil tersimpan, namun terjadi kesalahan server saat merubah password.', 'error');
                                })
                                .changeUserPassword(username, oldPass, newPass);
                        } else {
                            btn.disabled = false;
                            btn.innerHTML = originalText;
                            Swal.fire('Berhasil!', nameResponse.message, 'success');
                        }
                    } else {
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                        Swal.fire('Gagal', nameResponse.message, 'error');
                    }
                })
                .withFailureHandler(function (error) {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    Swal.fire('Error Sistem', 'Terjadi kesalahan saat menghubungi server.', 'error');
                })
                .changeUserName(username, newName);
        } else {
            // Simulasi Lokal
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                document.getElementById('profilNama').innerText = newName;
                Swal.fire('Preview Mode', 'Pembaruan berhasil disimulasikan.', 'success');
            }, 1000);
        }
    });

    document.getElementById('confirmPassword').addEventListener('input', function () {
        var newPass = document.getElementById('newPassword').value;
        var errText = document.getElementById('passwordError');
        if (this.value !== newPass && this.value !== "") errText.classList.remove('d-none');
        else errText.classList.add('d-none');
    });
});

// ==========================================
// LOGIKA PENGAMBILAN DATA (DARI SHEET: daftar_pengajuan)
// ==========================================

// Variabel Global
window.currentDataPengajuan = [];
let dataTableManajemen = null;
let savedCurrentPage = 1;

function loadSemuaPengajuan() {
    // Hancurkan instance DataTable sebelum memanipulasi DOM agar tidak terjadi double-wrapper/bug UI
    if (dataTableManajemen) {
        savedCurrentPage = dataTableManajemen.currentPage || 1;
        dataTableManajemen.destroy();
        dataTableManajemen = null;
    }

    var tableBody = document.getElementById('bodyTabelManajemen');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary mb-2" role="status"></div><br><span class="text-muted">Memuat data terbaru...</span></td></tr>';

    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(renderTabelManajemen)
            .withFailureHandler(function (error) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger"><i class="fas fa-exclamation-triangle me-1"></i> Gagal memuat data: ' + error.message + '</td></tr>';
            })
            .getAllPengajuan(sessionStorage.getItem('authToken'));
    } else {
        // MODE PREVIEW
        setTimeout(() => {
            var dataSimulasiSheet = [
                {
                    rowIndex: 2,
                    tanggal: "03/06/2026",
                    idTiket: "TKT-1001",
                    namaPemohon: "Budi Santoso",
                    jabatan: "Guru Kelas",
                    npsn: "20512345",
                    satuanPendidikan: "SDN 1 Kepanjen",
                    jenjang: "SD",
                    statusSekolah: "Negeri",
                    kecamatan: "Kepanjen",
                    layananPendidikan: "Pergantian Kepala Sekolah Baru (Definitif)",
                    keterangan: "Pengajuan SK Definitif Kepala Sekolah yang baru terlantik.",
                    dokumen: "https://drive.google.com/file/d/dummy1/view",
                    status: "Menunggu Verifikasi"
                },
                {
                    rowIndex: 3,
                    tanggal: "02/06/2026",
                    idTiket: "TKT-1002",
                    namaPemohon: "Siti Aminah",
                    jabatan: "Kepala Sekolah",
                    npsn: "20554321",
                    satuanPendidikan: "SMPN 1 Singosari",
                    jenjang: "SMP",
                    statusSekolah: "Negeri",
                    kecamatan: "Singosari",
                    layananPendidikan: "Reset Akun ARKAS Satuan Pendidikan",
                    keterangan: "Laptop sekolah rusak, butuh reset device ARKAS karena pindah ke laptop yang baru dibeli.",
                    dokumen: "https://drive.google.com/file/d/dummy2/view",
                    status: "Disetujui"
                },
                {
                    rowIndex: 4,
                    tanggal: "01/06/2026",
                    idTiket: "TKT-1003",
                    namaPemohon: "Ahmad Dahlan",
                    jabatan: "Operator Yayasan",
                    npsn: "69875412",
                    satuanPendidikan: "KB PENYEJUK HATI", // Simulasi Data Sekolah
                    jenjang: "PAUD",
                    statusSekolah: "Swasta",
                    kecamatan: "Turen",
                    layananPendidikan: "Perubahan Nama Operator Sekolah",
                    keterangan: "Operator lama pindah tugas, mutasi dapodik.",
                    dokumen: "https://drive.google.com/file/d/dummy3/view",
                    status: "Ditolak",
                    alasanTolak: "Surat permohonan kurang lengkap."
                }
            ];
            renderTabelManajemen(dataSimulasiSheet);
        }, 1200);
    }
}

function terapkanFilterStatusPengajuan() {
    var filterValue = document.getElementById('filterStatusPengajuan').value.toLowerCase();
    if (!filterValue) {
        renderTabelManajemen(window.currentDataPengajuan, true);
        return;
    }

    var filteredData = window.currentDataPengajuan.filter(function (item) {
        var statusText = (item.status || "").toLowerCase();
        if (filterValue === "disetujui") {
            return statusText.includes("selesai") || statusText.includes("setuju");
        }
        if (filterValue === "ditolak") {
            return statusText.includes("tolak") || statusText.includes("batal");
        }
        if (filterValue === "menunggu verifikasi") {
            return !statusText.includes("selesai") && !statusText.includes("setuju") && !statusText.includes("tolak") && !statusText.includes("batal");
        }
        return statusText.includes(filterValue);
    });
    renderTabelManajemen(filteredData, true);
}

function renderTabelManajemen(data, skipStatsUpdate) {
    // Simpan data di global agar bisa diakses oleh Modal HANYA JIKA BUKAN DARI FILTER
    if (!skipStatsUpdate) {
        window.currentDataPengajuan = data;
    }

    if (dataTableManajemen) {
        savedCurrentPage = dataTableManajemen.currentPage || 1;
        dataTableManajemen.destroy();
        dataTableManajemen = null;
    }

    var tableBody = document.getElementById('bodyTabelManajemen');
    tableBody.innerHTML = '';

    let total = 0, menunggu = 0, disetujui = 0, ditolak = 0;

    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted fst-italic">Belum ada data pengajuan.</td></tr>';
    } else {
        total = data.length;
        let htmlRows = [];
        data.forEach(function (item) {
            var badgeClass = "bg-warning text-dark";
            var statusText = (item.status || "").toLowerCase();

            if (statusText.includes("selesai") || statusText.includes("setuju")) { badgeClass = "bg-success"; disetujui++; }
            else if (statusText.includes("tolak") || statusText.includes("batal")) { badgeClass = "bg-danger text-white"; ditolak++; }
            else { menunggu++; }

            var linkDokumen = (item.dokumen && item.dokumen.includes("http"))
                ? `<a href="${item.dokumen}" target="_blank" class="btn btn-sm btn-outline-info" title="Lihat Dokumen"><i class="fas fa-external-link-alt"></i></a>`
                : `<span class="text-muted small">Tidak ada link</span>`;

            // Tombol Aksi View dan Hapus
            var btnAksiView = `
                            <div class="d-flex justify-content-center gap-1">
                                <button class="btn btn-sm text-white shadow-sm" style="background-color: #4747a1; border-color: #4747a1;" onclick="bukaModalView('${item.idTiket}')" title="Lihat Detail">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-danger shadow-sm" onclick="konfirmasiHapus('${item.rowIndex}', '${item.idTiket}')" title="Hapus Pengajuan">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        `;

            // DIPERBARUI SESUAI PERMINTAAN: URUTAN TAMPILAN NPSN, NAMA SEKOLAH, KECAMATAN
            htmlRows.push(`
                            <tr>
                                <td><span class="small fw-semibold">${item.tanggal}</span></td>
                                <td><span class="badge bg-secondary text-white">${escapeHTML(item.idTiket || "-")}</span></td>
                                <td>
                                    <div class="small mt-2 text-muted">
                                        <i class="fas fa-id-card fa-fw me-1" title="NPSN"></i>NPSN: <strong>${escapeHTML(item.npsn)}</strong><br>
                                        <i class="fas fa-school fa-fw me-1" title="Nama Sekolah"></i>${escapeHTML(item.satuanPendidikan)}<br>
                                        <i class="fas fa-map-marker-alt fa-fw me-1" title="Kecamatan"></i>Kec. ${escapeHTML(item.kecamatan || "-")}
                                    </div>
                                </td>
                                <td>
                                    <span class="small fw-bold text-primary">${escapeHTML(item.layananPendidikan)}</span><br>
                                    <span class="text-muted small" style="display:inline-block; max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHTML(item.keterangan)}">Ket: ${escapeHTML(item.keterangan)}</span>
                                </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="bg-light rounded-circle p-2 me-2 d-flex justify-content-center align-items-center" style="width: 35px; height: 35px;">
                                            <i class="fas fa-user text-secondary"></i>
                                        </div>
                                        <div>
                                            <span class="fw-bold d-block small">${escapeHTML(item.namaPemohon)}</span>
                                            <span class="text-muted" style="font-size: 0.75rem;">${escapeHTML(item.jabatan)}</span>
                                        </div>
                                    </div>
                                </td>
                                <td class="text-center">${linkDokumen}</td>
                                <td class="text-center"><span class="badge ${badgeClass} py-2 px-3 shadow-sm">${item.status || "Menunggu Verifikasi"}</span></td>
                                <td class="text-center" style="min-width: 100px;">${btnAksiView}</td>
                            </tr>
                        `);
        });

        tableBody.innerHTML = htmlRows.join('');

        // Initialize DataTable
        setTimeout(() => {
            const tableEl = document.getElementById('tabelManajemenData');
            if (tableEl) {
                dataTableManajemen = new simpleDatatables.DataTable(tableEl, {
                    perPage: 10,
                    perPageSelect: [5, 10, 20, 50, 100],
                    searchable: true,
                    sortable: true,
                    labels: {
                        placeholder: "Cari berdasarkan NPSN...",
                        perPage: "entri per halaman",
                        noRows: "Tidak ada data pengajuan.",
                        info: "Menampilkan {start} - {end} dari {rows} data"
                    }
                });

                // Kembalikan ke halaman sebelumnya jika tidak berada di halaman 1
                if (savedCurrentPage > 1) {
                    setTimeout(() => {
                        try {
                            dataTableManajemen.page(savedCurrentPage);
                        } catch (e) { }
                    }, 100);
                }
            }
        }, 50);
    }

    // Update Dashboard Stat Animasi Angka
    if (!skipStatsUpdate) {
        if (document.getElementById('countTotal')) document.getElementById('countTotal').innerText = total;
        if (document.getElementById('countMenunggu')) document.getElementById('countMenunggu').innerText = menunggu;
        if (document.getElementById('countDisetujui')) document.getElementById('countDisetujui').innerText = disetujui;
        if (document.getElementById('countDitolak')) document.getElementById('countDitolak').innerText = ditolak;
    }
}

// Fungsi untuk menampilkan text area Alasan Penolakan
function toggleAlasanTolak() {
    var selectedRadio = document.querySelector('input[name="modalRadioStatus"]:checked');
    var divAlasan = document.getElementById('divAlasanTolak');

    if (selectedRadio && selectedRadio.value === 'Ditolak') {
        divAlasan.classList.remove('d-none');
    } else {
        divAlasan.classList.add('d-none');
    }
}

// Fungsi untuk Membuka Modal dan Memuat Data Terpilih
function bukaModalView(idTiket) {
    if (!window.currentDataPengajuan) return;

    // Cari data spesifik berdasarkan ID Tiket
    var item = window.currentDataPengajuan.find(x => x.idTiket === idTiket);
    if (!item) return;

    // Masukkan data ke dalam modal
    document.getElementById('detailIdTiket').innerText = item.idTiket;
    document.getElementById('detailTanggal').innerText = item.tanggal;
    document.getElementById('detailPemohon').innerText = item.namaPemohon;

    // DIPERBARUI: Urutan NPSN kemudian Nama Sekolah di dalam modal
    document.getElementById('detailSekolah').innerHTML = `NPSN: ${escapeHTML(item.npsn)} <br> ${escapeHTML(item.satuanPendidikan)}`;
    document.getElementById('detailKecamatan').innerHTML = `<i class="fas fa-map-marker-alt me-1"></i>Kecamatan ${escapeHTML(item.kecamatan || "-")}`;

    document.getElementById('detailLayanan').innerText = item.layananPendidikan;
    document.getElementById('detailKeterangan').innerText = item.keterangan || '-';

    // Tombol Dokumen & Embed di dalam modal
    if (item.dokumen && item.dokumen.includes("http")) {
        // Konversi URL agar embeddable (khusus Google Drive)
        let embedUrl = item.dokumen;
        if (embedUrl.includes("drive.google.com") && embedUrl.includes("/view")) {
            embedUrl = embedUrl.replace("/view", "/preview");
        }

        document.getElementById('detailDokumen').innerHTML = `
                        <div class="mb-3 border rounded bg-light overflow-hidden shadow-sm" style="height: 60vh; min-height: 400px;">
                            <iframe src="${embedUrl}" style="width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
                        </div>
                        <a href="${item.dokumen}" target="_blank" class="btn text-white w-100 fw-semibold shadow-sm" style="background-color: #4747a1; border-color: #4747a1;">
                            <i class="fas fa-external-link-alt me-2"></i>Buka Dokumen di Tab Baru (Layar Penuh)
                        </a>
                    `;
    } else {
        document.getElementById('detailDokumen').innerHTML = '<span class="text-muted fst-italic">Tidak ada dokumen yang dilampirkan</span>';
    }

    // Set Value yang disembunyikan
    document.getElementById('modalRowIndex').value = item.rowIndex;

    // Set Radio Button status sesuai dengan status saat ini
    var currentStatus = item.status || "Menunggu Verifikasi";

    // Jika status saat ini adalah "Selesai Diproses", kita arahkan ke "Disetujui" di radio
    if (currentStatus === "Selesai Diproses") currentStatus = "Disetujui";

    var radioToSelect = document.querySelector(`input[name="modalRadioStatus"][value="${currentStatus}"]`);
    if (radioToSelect) {
        radioToSelect.checked = true;
    } else {
        document.getElementById('statusMenunggu').checked = true; // Fallback
    }

    // Reset alasan penolakan dan sesuaikan visibilitas kotak alasan
    document.getElementById('inputAlasanTolak').value = item.alasanTolak || "";
    toggleAlasanTolak();

    // Tampilkan Modal
    var modal = new bootstrap.Modal(document.getElementById('modalViewPengajuan'));
    modal.show();
}

// Memicu Update Status saat klik "Simpan" di Modal
function simpanStatusDariModal() {
    var idTiket = document.getElementById('detailIdTiket').innerText;
    var rowIndex = document.getElementById('modalRowIndex').value;

    var radioChecked = document.querySelector('input[name="modalRadioStatus"]:checked');
    var statusBaru = radioChecked ? radioChecked.value : "Menunggu Verifikasi";
    var alasanTolak = "";

    // Validasi alasan ditolak
    if (statusBaru === 'Ditolak') {
        alasanTolak = document.getElementById('inputAlasanTolak').value.trim();
        if (alasanTolak === "") {
            Swal.fire({
                icon: 'warning',
                title: 'Perhatian',
                text: 'Harap isi alasan kenapa pengajuan ini ditolak!'
            });
            return; // Berhenti jika kosong
        }
    }

    // Sembunyikan Modal jika validasi lolos
    var modalEl = document.getElementById('modalViewPengajuan');
    var modalObj = bootstrap.Modal.getInstance(modalEl);
    if (modalObj) modalObj.hide();

    // Lanjut ke eksekusi update
    ubahStatusPengajuan(rowIndex, statusBaru, idTiket, alasanTolak);
}

// Fungsi Eksekusi Perubahan Status ke Spreadsheet
function ubahStatusPengajuan(rowIndex, statusBaru, idTiket, alasanTolak = "") {
    var teksKonfirmasi = `Anda akan mengubah status Tiket <b>${idTiket}</b> menjadi "<span class="text-primary">${statusBaru}</span>".`;

    if (statusBaru === 'Ditolak') {
        teksKonfirmasi += `<br><br><span class="text-danger">Alasan: ${alasanTolak}</span>`;
    }
    teksKonfirmasi += `<br><br>Lanjutkan?`;

    Swal.fire({
        title: 'Update Status Tiket',
        html: teksKonfirmasi,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3c8dbc',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Update!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {

            Swal.fire({
                title: 'Menyimpan ke Sheet...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(function (response) {
                        if (response.success) {
                            Swal.fire('Berhasil!', response.message, 'success');
                            loadSemuaPengajuan(); // Refresh tabel
                        } else {
                            Swal.fire('Gagal!', response.message, 'error');
                        }
                    })
                    .withFailureHandler(function (error) {
                        Swal.fire('Error!', 'Terjadi kesalahan sistem saat menghubungi Sheet.', 'error');
                    })
                    // Kirim alasanTolak juga ke backend Apps Script (parameter ke-3)
                    .updateStatusTiket(sessionStorage.getItem('authToken'), rowIndex, statusBaru, alasanTolak);
            } else {
                setTimeout(() => {
                    Swal.fire('Preview', `Status ${idTiket} berhasil diubah menjadi ${statusBaru} (Simulasi)`, 'success');
                    loadSemuaPengajuan(); // Reset UI preview
                }, 1000);
            }
        } else {
            // Jika dibatalkan, load ulang saja tanpa mengganti apa-apa
            loadSemuaPengajuan();
        }
    });
}

// Fungsi Eksekusi Hapus Data
function konfirmasiHapus(rowIndex, idTiket) {
    Swal.fire({
        title: 'Hapus Pengajuan?',
        html: `Anda yakin ingin menghapus pengajuan <b>${idTiket}</b>?<br><br><span class="text-danger small"><i class="fas fa-exclamation-triangle me-1"></i> Data yang dihapus tidak dapat dikembalikan.</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: '<i class="fas fa-trash-alt me-1"></i> Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Menghapus Data...',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(function (response) {
                        if (response && response.success) {
                            Swal.fire({
                                title: 'Terhapus!',
                                text: 'Data pengajuan berhasil dihapus.',
                                icon: 'success',
                                confirmButtonText: 'OK'
                            }).then(() => {
                                // Hanya memuat ulang tabel saja agar user tidak pindah tab
                                loadSemuaPengajuan();
                            });
                        } else {
                            Swal.fire('Gagal!', (response && response.message) ? response.message : 'Terjadi kesalahan.', 'error');
                        }
                    })
                    .withFailureHandler(function (error) {
                        Swal.fire('Error!', 'Gagal menghubungi server.', 'error');
                    })
                    .hapusTiket(sessionStorage.getItem('authToken'), rowIndex); // Fungsi ini perlu ditambahkan di Code.gs
            } else {
                setTimeout(() => {
                    Swal.fire({
                        title: 'Preview',
                        text: `Data ${idTiket} berhasil dihapus (Simulasi)`,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        if (window.currentDataPengajuan) {
                            window.currentDataPengajuan = window.currentDataPengajuan.filter(item => item.idTiket !== idTiket);
                            renderTabelManajemen(window.currentDataPengajuan);
                        } else {
                            loadSemuaPengajuan();
                        }
                    });
                }, 1000);
            }
        }
    });
}

// ==========================================
// LOGIKA FORM BUILDER (PENDATAAN)
// ==========================================
let questionCount = 0;

function addQuestionCard() {
    questionCount++;
    const qId = 'question_' + questionCount;
    const cardHtml = `
                <div class="card border-0 shadow-sm mb-4 question-card" id="${qId}" 
                     style="border-left: 6px solid #4285f4; border-radius: 8px;">
                    <div class="card-body p-3 p-md-4">
                        <div class="row gx-4 mb-4">
                            <div class="col-md-8 mb-3 mb-md-0">
                                <input type="text" class="form-control fw-bold text-dark bg-transparent px-0 rounded-0" placeholder="Pertanyaan Tanpa Judul" 
                                    style="font-size: 0.85rem; border: none; border-bottom: 1px solid #e0e0e0; box-shadow: none; transition: border-color 0.3s;"
                                    onfocus="this.style.borderBottom='2px solid #673ab7';" 
                                    onblur="this.style.borderBottom='1px solid #e0e0e0';">
                            </div>
                            <div class="col-md-4">
                                <select class="form-select border text-secondary shadow-none" style="border-radius: 4px; font-size: 0.75rem; padding-top: 0.5rem; padding-bottom: 0.5rem;" onchange="changeQuestionType('${qId}', this.value)">
                                    <option value="short" selected>Teks jawaban singkat</option>
                                    <option value="paragraph">Paragraf</option>
                                    <option value="number">Angka</option>
                                    <option value="date">Tanggal</option>
                                    <option disabled>â”€â”€â”€â”€â”€â”€</option>
                                    <option value="radio">Pilihan ganda</option>
                                    <option value="checkbox">Kotak centang</option>
                                    <option value="dropdown">Pilihan dropdown</option>
                                    <option disabled>â”€â”€â”€â”€â”€â”€</option>
                                    <option value="file">Upload file</option>
                                </select>
                            </div>
                        </div>
                        
                        <div id="${qId}_options" class="mb-4">
                            <div class="text-muted border-bottom border-secondary border-opacity-25 pb-1 w-50" style="font-size: 0.75rem;">Teks jawaban singkat</div>
                        </div>

                        <hr class="mt-4 mb-3" style="opacity: 0.1;">
                        <div class="d-flex justify-content-end align-items-center">
                            <button class="btn btn-link text-muted me-4 p-0 text-decoration-none" title="Hapus Pertanyaan" onmouseover="this.classList.remove('text-muted'); this.classList.add('text-danger')" onmouseout="this.classList.add('text-muted'); this.classList.remove('text-danger')" onclick="document.getElementById('${qId}').remove()"><i class="fas fa-trash-alt fs-5"></i></button>
                            <div class="form-check form-switch m-0 border-start ps-4 py-1 d-flex align-items-center">
                                <input class="form-check-input mt-0 me-2" type="checkbox" id="${qId}_required" style="cursor: pointer;">
                                <label class="form-check-label text-dark fw-medium" for="${qId}_required" style="cursor: pointer; font-size: 0.75rem;">Wajib diisi</label>
                            </div>
                        </div>
                    </div>
                </div>
            `;

    document.getElementById('formBuilderQuestions').insertAdjacentHTML('beforeend', cardHtml);

    // Scroll sedikit ke bawah untuk memfokuskan pertanyaan baru
    setTimeout(() => {
        const el = document.getElementById(qId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function changeQuestionType(qId, type) {
    const optionsContainer = document.getElementById(qId + '_options');
    if (type === 'short') {
        optionsContainer.innerHTML = `<div class="text-muted border-bottom border-secondary border-opacity-25 pb-1 w-50" style="font-size: 0.75rem;">Teks jawaban singkat</div>`;
    } else if (type === 'paragraph') {
        optionsContainer.innerHTML = `<div class="text-muted border-bottom border-secondary border-opacity-25 pb-1 w-100" style="font-size: 0.75rem;">Teks jawaban panjang</div>`;
    } else if (type === 'number') {
        optionsContainer.innerHTML = `<div class="text-muted border-bottom border-secondary border-opacity-25 pb-1 w-50" style="font-size: 0.75rem;">Angka</div>`;
    } else if (type === 'date') {
        optionsContainer.innerHTML = `<div class="text-muted border-bottom border-secondary border-opacity-25 pb-1 w-25 d-flex align-items-center justify-content-between" style="font-size: 0.75rem;"><span>Bulan, hari, tahun</span><i class="far fa-calendar-alt"></i></div>`;
    } else if (type === 'radio') {
        optionsContainer.innerHTML = `
                    <div class="option-list">
                        <div class="d-flex align-items-center mb-2">
                            <i class="far fa-circle text-muted me-3" style="font-size: 1.1rem; width: 20px;"></i>
                            <input type="text" class="form-control form-control-sm border-0 border-bottom bg-transparent px-0 rounded-0" value="Opsi 1" 
                                style="width: 75%; font-size: 0.75rem; box-shadow: none;"
                                onfocus="this.style.borderBottom='2px solid #673ab7'" onblur="this.style.borderBottom='1px solid #d1d1d1'">
                        </div>
                        <div class="d-flex align-items-center mt-3">
                            <i class="far fa-circle text-muted me-3" style="font-size: 1.1rem; width: 20px;"></i>
                            <button class="btn btn-sm btn-link text-decoration-none p-0 fw-medium" style="color: #1a73e8; font-size: 0.75rem;" onclick="addOption(this, 'radio')">Tambahkan opsi</button>
                        </div>
                    </div>
                `;
    } else if (type === 'checkbox') {
        optionsContainer.innerHTML = `
                    <div class="option-list">
                        <div class="d-flex align-items-center mb-2">
                            <i class="far fa-square text-muted me-3" style="font-size: 1.1rem; width: 20px;"></i>
                            <input type="text" class="form-control form-control-sm border-0 border-bottom bg-transparent px-0 rounded-0" value="Opsi 1" 
                                style="width: 75%; font-size: 0.75rem; box-shadow: none;"
                                onfocus="this.style.borderBottom='2px solid #673ab7'" onblur="this.style.borderBottom='1px solid #d1d1d1'">
                        </div>
                        <div class="d-flex align-items-center mt-3">
                            <i class="far fa-square text-muted me-3" style="font-size: 1.1rem; width: 20px;"></i>
                            <button class="btn btn-sm btn-link text-decoration-none p-0 fw-medium" style="color: #1a73e8; font-size: 0.75rem;" onclick="addOption(this, 'checkbox')">Tambahkan opsi</button>
                        </div>
                    </div>
                `;
    } else if (type === 'dropdown') {
        optionsContainer.innerHTML = `
                    <div class="option-list">
                        <div class="d-flex align-items-center mb-2">
                            <span class="text-muted fw-bold me-3 text-end dropdown-num" style="font-size: 1rem; width: 20px;">1.</span>
                            <input type="text" class="form-control form-control-sm border-0 border-bottom bg-transparent px-0 rounded-0" value="Opsi 1" 
                                style="width: 75%; font-size: 0.75rem; box-shadow: none;"
                                onfocus="this.style.borderBottom='2px solid #673ab7'" onblur="this.style.borderBottom='1px solid #d1d1d1'">
                        </div>
                        <div class="d-flex align-items-center mt-3">
                            <span class="text-muted fw-bold me-3 text-end dropdown-num" style="font-size: 1rem; width: 20px;">2.</span>
                            <button class="btn btn-sm btn-link text-decoration-none p-0 fw-medium" style="color: #1a73e8; font-size: 0.75rem;" onclick="addOption(this, 'dropdown')">Tambahkan opsi</button>
                        </div>
                    </div>
                `;
    } else if (type === 'file') {
        optionsContainer.innerHTML = `
                    <div class="p-3 bg-light rounded border text-muted">
                        <i class="fas fa-cloud-upload-alt me-2 fs-5"></i>
                        <span style="font-size: 0.75rem;">Responden dapat mengupload file ke Google Drive</span>
                    </div>
                `;
    }
}

function addOption(btnElement, type) {
    const optionList = btnElement.closest('.option-list');
    const btnDiv = btnElement.closest('.d-flex');

    let iconHtml = '';
    if (type === 'radio') {
        iconHtml = '<i class="far fa-circle text-muted me-3" style="font-size: 1.1rem; width: 20px;"></i>';
    } else if (type === 'checkbox') {
        iconHtml = '<i class="far fa-square text-muted me-3" style="font-size: 1.1rem; width: 20px;"></i>';
    } else if (type === 'dropdown') {
        const count = optionList.querySelectorAll('input[type="text"]').length + 1;
        iconHtml = `<span class="text-muted fw-bold me-3 text-end dropdown-num" style="font-size: 1rem; width: 20px;">${count}.</span>`;
        // Update angka pada tombol 'Tambahkan opsi'
        btnDiv.querySelector('.dropdown-num').innerText = (count + 1) + '.';
    }

    const newOption = document.createElement('div');
    newOption.className = 'd-flex align-items-center mb-2';
    newOption.innerHTML = `
                ${iconHtml}
                <input type="text" class="form-control form-control-sm border-0 border-bottom bg-transparent px-0 rounded-0" placeholder="Opsi baru" 
                    style="width: 75%; font-size: 0.75rem; box-shadow: none;"
                    onfocus="this.style.borderBottom='2px solid #673ab7'" onblur="this.style.borderBottom='1px solid #d1d1d1'">
                <button class="btn btn-sm btn-link text-muted ms-3 text-decoration-none" onmouseover="this.classList.remove('text-muted'); this.classList.add('text-danger')" onmouseout="this.classList.add('text-muted'); this.classList.remove('text-danger')" onclick="removeOption(this, '${type}')" title="Hapus Opsi"><i class="fas fa-times fs-5"></i></button>
            `;
    optionList.insertBefore(newOption, btnDiv);
}

function removeOption(btnElement, type) {
    const optionList = btnElement.closest('.option-list');
    btnElement.closest('.d-flex').remove();
    if (type === 'dropdown') {
        const spans = optionList.querySelectorAll('span.dropdown-num');
        spans.forEach((span, index) => {
            span.innerText = (index + 1) + '.';
        });
    }
}

function getFormData() {
    const formData = {
        title: document.getElementById('formBuilderTitle').value || 'Formulir Tanpa Judul',
        description: document.getElementById('formBuilderDesc').value || '',
        questions: []
    };

    const questionCards = document.querySelectorAll('.question-card');
    questionCards.forEach(card => {
        const qInput = card.querySelector('input[type="text"]');
        const typeSelect = card.querySelector('select');
        const requiredCheck = card.querySelector('.form-check-input');

        const qData = {
            title: qInput ? (qInput.value || 'Pertanyaan Tanpa Judul') : 'Pertanyaan Tanpa Judul',
            type: typeSelect ? typeSelect.value : 'short',
            required: requiredCheck ? requiredCheck.checked : false,
            options: []
        };

        if (['radio', 'checkbox', 'dropdown'].includes(qData.type)) {
            const optionInputs = card.querySelectorAll('.option-list input[type="text"]');
            optionInputs.forEach(opt => {
                if (opt.value.trim() !== '') {
                    qData.options.push(opt.value.trim());
                }
            });
        }
        formData.questions.push(qData);
    });

    return formData;
}

function simpanFormPendataan() {
    const formData = getFormData();

    if (formData.questions.length === 0) {
        Swal.fire('Peringatan', 'Silakan tambahkan setidaknya satu pertanyaan sebelum menyimpan formulir.', 'warning');
        return;
    }

    Swal.fire({
        title: 'Simpan Formulir?',
        text: 'Formulir "' + formData.title + '" akan disimpan ke dalam database sistem.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, simpan',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#673ab7'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Menyimpan...',
                text: 'Mohon tunggu, data sedang disimpan ke Spreadsheet...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(function (response) {
                        if (response.success) {
                            Swal.fire({
                                title: 'Berhasil!',
                                text: response.message,
                                icon: 'success',
                                confirmButtonText: 'OK',
                                confirmButtonColor: '#673ab7'
                            }).then(() => {
                                // Tutup form builder dan kembali ke daftar form
                                toggleFormBuilder();
                            });
                        } else {
                            Swal.fire('Gagal Menyimpan', response.message, 'error');
                        }
                    })
                    .withFailureHandler(function (error) {
                        Swal.fire('Error Database', error.message, 'error');
                    })
                    .simpanDataPendataan(sessionStorage.getItem('authToken'), JSON.stringify(formData));
            } else {
                console.log("Data JSON yang dikirim ke backend:", JSON.stringify(formData, null, 2));
                setTimeout(() => {
                    Swal.fire('Disimulasikan (Lokal)', 'Backend tidak terdeteksi. Silakan periksa console log.', 'info');
                }, 1000);
            }
        }
    });
}

function togglePasswordVisibility(inputId, btnElement) {
    const input = document.getElementById(inputId);
    const icon = btnElement.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function logoutApp() {
    var token = sessionStorage.getItem('authToken');
    if (token && typeof google !== 'undefined' && google.script) {
        google.script.run.logoutServer(token);
    }
    sessionStorage.clear();
    if (typeof SCRIPT_URL !== 'undefined' && SCRIPT_URL) {
        window.top.location.href = SCRIPT_URL + "?page=login";
    } else if (typeof google !== 'undefined' && google.script) {
        google.script.run.withSuccessHandler(function (url) {
            window.top.location.href = url + "?page=login";
        }).getScriptUrl();
    } else {
        window.location.reload();
    }
}

function toggleFormBuilder() {
    var builder = document.getElementById('formBuilderContainer');
    var daftar = document.getElementById('daftarFormContainer');
    if (builder.classList.contains('d-none')) {
        builder.classList.remove('d-none');
        daftar.classList.add('d-none');
    } else {
        builder.classList.add('d-none');
        daftar.classList.remove('d-none');
        loadDaftarForm(); // Reload list
    }
}

let dataTableDaftarForm = null;

function loadDaftarForm() {
    if (dataTableDaftarForm) {
        dataTableDaftarForm.destroy();
        dataTableDaftarForm = null;
    }

    var tableBody = document.getElementById('bodyDaftarForm');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary mb-2" role="status"></div><br><span class="text-muted">Memuat data form...</span></td></tr>';

    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(renderDaftarForm)
            .withFailureHandler(function (error) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger"><i class="fas fa-exclamation-triangle me-1"></i> Gagal memuat data: ' + error.message + '</td></tr>';
            })
            .getAllFormPendataan(sessionStorage.getItem('authToken'));
    } else {
        renderDaftarForm([]);
    }
}

function renderDaftarForm(data) {
    var tableBody = document.getElementById('bodyDaftarForm');
    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted fst-italic">Belum ada form pendataan yang dibuat.</td></tr>';
    } else {
        data.forEach(function (item) {
            var btnLihat = `<button class="btn btn-sm btn-info shadow-sm me-1 text-white" onclick="lihatHasilForm('${item.idForm}')" title="Lihat Hasil Input"><i class="fas fa-eye"></i></button>`;
            var btnHapus = `<button class="btn btn-sm btn-danger shadow-sm" onclick="hapusFormPendataanUI('${item.idForm}')" title="Hapus Form"><i class="fas fa-trash-alt"></i></button>`;

            tableBody.insertAdjacentHTML('beforeend', `
                        <tr>
                            <td><span class="badge bg-secondary text-white">${item.idForm}</span></td>
                            <td><span class="small fw-semibold">${item.tanggal}</span></td>
                            <td><span class="fw-bold text-dark">${item.judul}</span></td>
                            <td><span class="text-muted small" style="display:inline-block; max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.deskripsi}">${item.deskripsi || "-"}</span></td>
                            <td class="text-center">${btnLihat} ${btnHapus}</td>
                        </tr>
                    `);
        });

        setTimeout(() => {
            const tableEl = document.getElementById('tabelDaftarForm');
            if (tableEl) {
                dataTableDaftarForm = new simpleDatatables.DataTable(tableEl, {
                    perPage: 5,
                    perPageSelect: [5, 10, 20],
                    searchable: true,
                    sortable: true,
                    labels: {
                        placeholder: "Cari form...",
                        perPage: "entri",
                        noRows: "Tidak ada form.",
                        info: "Menampilkan {start} - {end} dari {rows} data"
                    }
                });
            }
        }, 50);
    }
}

function hapusFormPendataanUI(idForm) {
    Swal.fire({
        title: 'Hapus Form?',
        text: "Anda yakin ingin menghapus form ini secara permanen?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(function (response) {
                        if (response.success) {
                            Swal.fire('Terhapus!', response.message, 'success');
                            loadDaftarForm();
                        } else {
                            Swal.fire('Gagal', response.message, 'error');
                        }
                    })
                    .withFailureHandler(function (error) {
                        Swal.fire('Error', error.message, 'error');
                    })
                    .hapusFormPendataan(sessionStorage.getItem('authToken'), idForm);
            }
        }
    });
}
var currentHasilData = [];
var currentHasilHeaders = [];
var currentHasilIdForm = "";

function kembaliKeDaftarForm() {
    var tabEl = document.getElementById('tab-daftar-form');
    var tab = new bootstrap.Tab(tabEl);
    tab.show();
}

function renderTabelHasil(dataArray) {
    var head = document.getElementById('headTabelHasil');
    var body = document.getElementById('bodyTabelHasil');

    if (!currentHasilHeaders.length) return;

    // Render Header
    var trHead = '<tr>';
    currentHasilHeaders.forEach(function (h) {
        trHead += `<th>${h}</th>`;
    });
    trHead += '<th>Aksi</th></tr>';
    head.innerHTML = trHead;

    // Render Body
    body.innerHTML = '';
    if (dataArray.length === 0) {
        body.innerHTML = `<tr><td colspan="${currentHasilHeaders.length + 1}" class="text-center py-4 text-muted fst-italic">Tidak ada data yang sesuai dengan filter</td></tr>`;
        return;
    }

    dataArray.forEach(function (rowObj) {
        var trBody = '<tr>';
        currentHasilHeaders.forEach(function (h) {
            var cellData = rowObj[h] || "";
            trBody += `<td>${cellData}</td>`;
        });
        var idJawaban = rowObj["ID Jawaban"];
        trBody += `<td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="hapusJawabanUI('${currentHasilIdForm}', '${idJawaban}')" title="Hapus Jawaban">
                        <i class="fas fa-trash"></i>
                    </button>
                </td></tr>`;
        body.insertAdjacentHTML('beforeend', trBody);
    });
}

function terapkanFilterJenjang() {
    var filterValue = document.getElementById('filterJenjang').value;
    if (!filterValue) {
        renderTabelHasil(currentHasilData);
        return;
    }

    var filteredData = currentHasilData.filter(function (rowObj) {
        // Asumsi kolom Jenjang bernama "Jenjang"
        var jenjangStr = String(rowObj["Jenjang"] || "Tidak Diketahui");
        // Filter menggunakan indexof atau match jika ada variasi string
        return jenjangStr.toUpperCase().indexOf(filterValue.toUpperCase()) !== -1;
    });
    renderTabelHasil(filteredData);
}

function downloadCSVHasil() {
    if (!currentHasilData || currentHasilData.length === 0) {
        Swal.fire('Info', 'Tidak ada data untuk diunduh', 'info');
        return;
    }

    var filterValue = document.getElementById('filterJenjang').value;
    var dataToExport = currentHasilData;

    if (filterValue) {
        dataToExport = currentHasilData.filter(function (rowObj) {
            var jenjangStr = String(rowObj["Jenjang"] || "Tidak Diketahui");
            return jenjangStr.toUpperCase().indexOf(filterValue.toUpperCase()) !== -1;
        });
    }

    // Buat CSV
    var csvContent = "";
    var headersStr = currentHasilHeaders.map(function (h) {
        // escape quotes
        return '"' + String(h).replace(/"/g, '""') + '"';
    }).join(",");
    csvContent += headersStr + "\n";

    dataToExport.forEach(function (rowObj) {
        var rowStr = currentHasilHeaders.map(function (h) {
            var cellData = rowObj[h] || "";
            return '"' + String(cellData).replace(/"/g, '""') + '"';
        }).join(",");
        csvContent += rowStr + "\n";
    });

    // Trigger download
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Hasil_Input_${currentHasilIdForm}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function hapusJawabanUI(idForm, idJawaban) {
    Swal.fire({
        title: 'Hapus Jawaban?',
        text: "Jawaban ini akan dihapus secara permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(function (response) {
                        if (response.success) {
                            Swal.fire('Terhapus!', response.message, 'success');
                            lihatHasilForm(idForm); // Reload tabel
                        } else {
                            Swal.fire('Gagal', response.message, 'error');
                        }
                    })
                    .withFailureHandler(function (error) {
                        Swal.fire('Error', error.message, 'error');
                    })
                    .hapusJawabanForm(sessionStorage.getItem('authToken'), idForm, idJawaban);
            }
        }
    });
}

function lihatHasilForm(idForm) {
    currentHasilIdForm = idForm;
    // Pindah ke tab Hasil Input Form
    var tabEl = document.getElementById('tab-hasil-input');
    var tab = new bootstrap.Tab(tabEl);
    tab.show();

    // Ubah label
    var label = document.getElementById('labelHasilForm');
    if (label) label.innerText = "Menampilkan Hasil Untuk: " + idForm;

    // Disable controls
    var filterEl = document.getElementById('filterJenjang');
    var btnCsvEl = document.getElementById('btnDownloadCSV');
    if (filterEl) filterEl.disabled = true;
    if (btnCsvEl) btnCsvEl.disabled = true;

    var head = document.getElementById('headTabelHasil');
    var body = document.getElementById('bodyTabelHasil');

    // Set loading state
    head.innerHTML = '';
    body.innerHTML = '<tr><td class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Memuat data hasil formulir...</p></td></tr>';

    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(function (response) {
                if (response.success) {
                    currentHasilHeaders = response.headers;
                    currentHasilData = response.responses;

                    // Enable controls
                    if (filterEl) {
                        filterEl.disabled = false;
                        filterEl.value = ""; // Reset filter
                    }
                    if (btnCsvEl) btnCsvEl.disabled = false;

                    renderTabelHasil(currentHasilData);
                } else {
                    body.innerHTML = `<tr><td class="text-center py-4 text-muted fst-italic">${response.message}</td></tr>`;
                }
            })
            .withFailureHandler(function (error) {
                body.innerHTML = `<tr><td class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle me-1"></i> Gagal memuat data: ${error.message}</td></tr>`;
            })
            .getJawabanForm(sessionStorage.getItem('authToken'), idForm);
    } else {
        body.innerHTML = `<tr><td class="text-center py-4 text-muted fst-italic">Mode lokal. Data tidak dapat dimuat.</td></tr>`;
    }
}

// --- GLOBAL STATE USERS ---
var currentDataUsers = [];
var currentPageUsers = 1;
var currentLimitUsers = 5;
var currentSearchUsers = '';
let debounceTimerUsers = null;

function changeLimitUsers() {
    currentLimitUsers = document.getElementById('limitDataUsers').value;
    currentPageUsers = 1; // Reset ke halaman pertama jika limit diubah
    loadDataUsersPaginated();
}

function debounceSearchUsers() {
    clearTimeout(debounceTimerUsers);
    debounceTimerUsers = setTimeout(() => {
        currentSearchUsers = document.getElementById('searchDataUsers').value;
        currentPageUsers = 1; // Reset ke halaman pertama saat mencari
        loadDataUsersPaginated();
    }, 500); // Tunggu 500ms setelah mengetik
}

function goToPageUsers(page) {
    currentPageUsers = page;
    loadDataUsersPaginated();
}

function loadDataUsersPaginated() {
    var tableBody = document.getElementById('bodyDataUsers');
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="10" class="text-center py-4"><div class="spinner-border text-primary mb-2" role="status"></div><br><span class="text-muted">Mengambil data dari server...</span></td></tr>';

    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(renderDataUsersPaginated)
            .withFailureHandler(function (error) {
                if (tableBody) tableBody.innerHTML = '<tr><td colspan="10" class="text-center text-danger"><i class="fas fa-exclamation-triangle me-1"></i> Gagal memuat data: ' + error.message + '</td></tr>';
            })
            .getDataUsersPaginated(sessionStorage.getItem('authToken'), currentPageUsers, currentLimitUsers, currentSearchUsers);
    } else {
        // Mode Lokal / Dummy Data
        setTimeout(() => {
            renderDataUsersPaginated({
                data: [{ rowIndex: 2, username: 'user1', nama: 'Guru Lokal', npsn: '12345', sekolah: 'SD 1', jenjang: 'SD', statusSekolah: 'Negeri', kecamatan: 'Kepanjen', jabatan: 'Guru' }],
                total: 1,
                page: 1,
                limit: 5
            });
        }, 500);
    }
}

function renderDataUsersPaginated(response) {
    var tableBody = document.getElementById('bodyDataUsers');
    if (!tableBody) return;

    var data = response.data || [];
    var total = response.total || 0;
    var page = response.page || 1;
    var limit = response.limit || 5;

    if (data.length === 0) {
        currentDataUsers = [];
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted fst-italic">Tidak ada data user yang sesuai.</td></tr>';
        document.getElementById('infoDataUsers').innerText = "Menampilkan 0 - 0 dari 0 data";
        renderPaginationUI(0, 1, limit);
    } else {
        currentDataUsers = data; // Simpan ke global memori untuk edit

        var isSuperAdmin = false;
        try {
            var userStr = sessionStorage.getItem('userData');
            if (userStr) {
                var u = JSON.parse(userStr);
                if (u.role === 'superadmin' || u.role === 'super admin') isSuperAdmin = true;
            }
        } catch (e) { }

        var htmlContent = [];
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            var displayedIndex = ((page - 1) * limit) + i + 1;

            var actionsHTML = "<div class='btn-group btn-group-sm' role='group'>";
            if (isSuperAdmin) {
                actionsHTML += "<button class='btn btn-warning table-action-btn' title='Edit User' onclick='showModalEditUser(" + i + ")'><i class='fas fa-edit text-white'></i></button>";
            }
            actionsHTML += "<button class='btn btn-info table-action-btn' title='Reset Password' onclick='resetPasswordUserDialog(\"" + row.rowIndex + "\", \"" + escapeHTML(row.username) + "\")'><i class='fas fa-key text-white'></i></button>";
            if (isSuperAdmin) {
                actionsHTML += "<button class='btn btn-danger table-action-btn' title='Hapus User' onclick='hapusDataUser(\"" + row.rowIndex + "\", \"" + escapeHTML(row.username) + "\")'><i class='fas fa-trash-alt'></i></button>";
            }
            actionsHTML += "</div>";

            htmlContent.push(
                "<tr>" +
                "<td>" + displayedIndex + "</td>" +
                "<td><span class='badge bg-secondary'>" + escapeHTML(row.username) + "</span></td>" +
                "<td class='fw-bold text-dark'>" + escapeHTML(row.nama) + "</td>" +
                "<td>" + escapeHTML(row.npsn) + "</td>" +
                "<td><span style='display:inline-block; max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;' title='" + escapeHTML(row.sekolah) + "'>" + escapeHTML(row.sekolah) + "</span></td>" +
                "<td>" + escapeHTML(row.jenjang) + "</td>" +
                "<td>" + escapeHTML(row.statusSekolah) + "</td>" +
                "<td>" + escapeHTML(row.kecamatan) + "</td>" +
                "<td>" + escapeHTML(row.jabatan) + "</td>" +
                "<td>" + actionsHTML + "</td>" +
                "</tr>"
            );
        }
        tableBody.innerHTML = htmlContent.join("");

        // Update Info Teks
        var startItem = ((page - 1) * limit) + 1;
        var endItem = startItem + data.length - 1;
        document.getElementById('infoDataUsers').innerText = "Menampilkan " + startItem + " - " + endItem + " dari " + total + " data";

        // Update Paginasi Tombol
        renderPaginationUI(total, page, limit);
    }
}

function renderPaginationUI(total, currentPage, limit) {
    var ul = document.getElementById('paginationDataUsers');
    if (!ul) return;
    ul.innerHTML = '';

    var totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return; // Sembunyikan paginasi jika cuma 1 halaman atau 0

    // Tombol Prev
    var prevDisabled = (currentPage === 1) ? 'disabled' : '';
    ul.insertAdjacentHTML('beforeend', `<li class="page-item ${prevDisabled}"><a class="page-link" href="#" onclick="event.preventDefault(); if(${currentPage} > 1) goToPageUsers(${currentPage - 1})">Prev</a></li>`);

    // Menampilkan maksimal 5 halaman di tengah
    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, currentPage + 2);

    // Geser startPage/endPage agar pas 5 tombol jika ada cukup ruang
    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + 4);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, endPage - 4);
        }
    }

    for (var i = startPage; i <= endPage; i++) {
        var activeClass = (i === currentPage) ? 'active' : '';
        ul.insertAdjacentHTML('beforeend', `<li class="page-item ${activeClass}"><a class="page-link" href="#" onclick="event.preventDefault(); goToPageUsers(${i})">${i}</a></li>`);
    }

    // Tombol Next
    var nextDisabled = (currentPage === totalPages) ? 'disabled' : '';
    ul.insertAdjacentHTML('beforeend', `<li class="page-item ${nextDisabled}"><a class="page-link" href="#" onclick="event.preventDefault(); if(${currentPage} < ${totalPages}) goToPageUsers(${currentPage + 1})">Next</a></li>`);
}

// --- FUNGSI HAPUS USER ---
function hapusDataUser(rowIndex, username) {
    Swal.fire({
        title: 'Apakah Anda yakin?',
        html: 'Menghapus data user <b>' + username + '</b> tidak dapat dibatalkan.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74a3b',
        cancelButtonColor: '#858796',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Menghapus...',
                text: 'Mohon tunggu',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            });

            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(function () {
                        Swal.fire('Terhapus!', 'Data user berhasil dihapus.', 'success');
                        loadDataUsersPaginated(); // Refresh halaman tabel
                    })
                    .withFailureHandler(function (error) {
                        Swal.fire('Error!', 'Gagal menghapus user: ' + error.message, 'error');
                    })
                    .deleteDataUser(sessionStorage.getItem('authToken'), rowIndex);
            } else {
                // Mode lokal
                setTimeout(() => {
                    Swal.fire('Terhapus!', 'Data dummy berhasil dihapus (Mode Lokal).', 'success');
                }, 1000);
            }
        }
    });
}

// --- FUNGSI TAMBAH USER ---
function showModalTambahUser() {
    document.getElementById('formTambahUser').reset();
    var modal = new bootstrap.Modal(document.getElementById('modalTambahUser'));
    modal.show();
}

function simpanDataUser() {
    var username = document.getElementById('addUsername').value.trim();
    var password = document.getElementById('addPassword').value.trim();

    if (!username || !password) {
        Swal.fire('Peringatan', 'Username dan Password wajib diisi!', 'warning');
        return;
    }

    var userData = {
        username: username,
        password: password,
        nama: document.getElementById('addNama').value.trim(),
        npsn: document.getElementById('addNpsn').value.trim(),
        sekolah: document.getElementById('addSekolah').value.trim(),
        jenjang: document.getElementById('addJenjang').value.trim(),
        statusSekolah: document.getElementById('addStatusSekolah').value.trim(),
        kecamatan: document.getElementById('addKecamatan').value.trim(),
        jabatan: document.getElementById('addJabatan').value.trim()
    };

    Swal.fire({
        title: 'Menyimpan...',
        text: 'Menambahkan data user baru',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading()
        }
    });

    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(function () {
                Swal.fire('Sukses!', 'Data user berhasil ditambahkan.', 'success');
                var modalEl = document.getElementById('modalTambahUser');
                var modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                currentPageUsers = 1; // Kembali ke halaman pertama untuk melihat user baru
                loadDataUsersPaginated(); // Refresh halaman tabel
            })
            .withFailureHandler(function (error) {
                Swal.fire('Error!', 'Gagal menambah user: ' + error.message, 'error');
            })
            .addDataUser(sessionStorage.getItem('authToken'), userData);
    } else {
        // Mode lokal
        setTimeout(() => {
            Swal.fire('Sukses!', 'Data dummy berhasil ditambahkan (Mode Lokal).', 'success');
            var modalEl = document.getElementById('modalTambahUser');
            var modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }, 1000);
    }
}

// --- FUNGSI EDIT USER ---
function showModalEditUser(arrayIndex) {
    var row = currentDataUsers[arrayIndex];
    if (!row) return;

    document.getElementById('formEditUser').reset();
    document.getElementById('editRowIndex').value = row.rowIndex;
    document.getElementById('editUsername').value = row.username;
    document.getElementById('editNama').value = row.nama;
    document.getElementById('editNpsn').value = row.npsn;
    document.getElementById('editSekolah').value = row.sekolah;
    document.getElementById('editJenjang').value = row.jenjang;
    document.getElementById('editStatusSekolah').value = row.statusSekolah;
    document.getElementById('editKecamatan').value = row.kecamatan;
    document.getElementById('editJabatan').value = row.jabatan || 'Guru'; // Default Guru kalau kosong

    var modal = new bootstrap.Modal(document.getElementById('modalEditUser'));
    modal.show();
}

function simpanEditUser() {
    var rowIndex = document.getElementById('editRowIndex').value;
    var username = document.getElementById('editUsername').value.trim();

    if (!username) {
        Swal.fire('Peringatan', 'Username wajib diisi!', 'warning');
        return;
    }

    var userData = {
        username: username,
        nama: document.getElementById('editNama').value.trim(),
        npsn: document.getElementById('editNpsn').value.trim(),
        sekolah: document.getElementById('editSekolah').value.trim(),
        jenjang: document.getElementById('editJenjang').value.trim(),
        statusSekolah: document.getElementById('editStatusSekolah').value.trim(),
        kecamatan: document.getElementById('editKecamatan').value.trim(),
        jabatan: document.getElementById('editJabatan').value.trim()
    };

    Swal.fire({
        title: 'Menyimpan...',
        text: 'Memperbarui data user',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading()
        }
    });

    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(function () {
                Swal.fire('Sukses!', 'Data user berhasil diperbarui.', 'success');
                var modalEl = document.getElementById('modalEditUser');
                var modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();

                loadDataUsersPaginated(); // Refresh halaman
            })
            .withFailureHandler(function (error) {
                Swal.fire('Error!', 'Gagal mengubah user: ' + error.message, 'error');
            })
            .updateDataUser(sessionStorage.getItem('authToken'), rowIndex, userData);
    }
}

// --- FUNGSI RESET PASSWORD ---
function resetPasswordUserDialog(rowIndex, username) {
    Swal.fire({
        title: 'Reset Password',
        html: `Masukkan password baru untuk user <b>${username}</b>`,
        input: 'text',
        inputAttributes: {
            autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Simpan',
        cancelButtonText: 'Batal',
        showLoaderOnConfirm: true,
        preConfirm: (newPassword) => {
            if (!newPassword) {
                Swal.showValidationMessage('Password baru tidak boleh kosong');
                return false;
            }
            return new Promise((resolve, reject) => {
                if (typeof google !== 'undefined' && google.script) {
                    google.script.run
                        .withSuccessHandler(function () {
                            resolve(true);
                        })
                        .withFailureHandler(function (error) {
                            reject(new Error(error.message));
                        })
                        .resetPasswordUser(sessionStorage.getItem('authToken'), rowIndex, newPassword);
                } else {
                    setTimeout(() => resolve(true), 1000); // Simulasi lokal
                }
            }).catch(error => {
                Swal.showValidationMessage(`Gagal mereset: ${error.message}`);
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Tersimpan!',
                text: 'Password berhasil direset.',
                icon: 'success'
            });
        }
    });
}

// --- GLOBAL STATE ADMIN ---
var currentDataAdmin = [];
var currentPageAdmin = 1;
var currentLimitAdmin = 5;
var currentSearchAdmin = '';
let debounceTimerAdmin = null;

function changeLimitAdmin() {
    currentLimitAdmin = document.getElementById('limitDataAdmin').value;
    currentPageAdmin = 1;
    loadDataAdminPaginated();
}

function debounceSearchAdmin() {
    clearTimeout(debounceTimerAdmin);
    debounceTimerAdmin = setTimeout(() => {
        currentSearchAdmin = document.getElementById('searchDataAdmin').value;
        currentPageAdmin = 1;
        loadDataAdminPaginated();
    }, 500);
}

function goToPageAdmin(page) {
    currentPageAdmin = page;
    loadDataAdminPaginated();
}

function loadDataAdminPaginated() {
    var tableBody = document.getElementById('bodyDataAdmin');
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="10" class="text-center py-4"><div class="spinner-border text-primary mb-2" role="status"></div><br><span class="text-muted">Mengambil data dari server...</span></td></tr>';

    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(renderDataAdminPaginated)
            .withFailureHandler(function (error) {
                if (tableBody) tableBody.innerHTML = '<tr><td colspan="10" class="text-center text-danger"><i class="fas fa-exclamation-triangle me-1"></i> Gagal memuat data: ' + error.message + '</td></tr>';
            })
            .getDataAdminPaginated(sessionStorage.getItem('authToken'), currentPageAdmin, currentLimitAdmin, currentSearchAdmin);
    }
}

function renderDataAdminPaginated(response) {
    var tableBody = document.getElementById('bodyDataAdmin');
    if (!tableBody) return;

    var data = response.data || [];
    var total = response.total || 0;
    var page = response.page || 1;
    var limit = response.limit || 5;

    if (data.length === 0) {
        currentDataAdmin = [];
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted fst-italic">Tidak ada data admin yang sesuai.</td></tr>';
        document.getElementById('infoDataAdmin').innerText = "Menampilkan 0 - 0 dari 0 data";
        renderPaginationAdminUI(0, 1, limit);
    } else {
        currentDataAdmin = data;
        var htmlContent = [];
        var currentUserStr = sessionStorage.getItem('userData');
        var currentUser = currentUserStr ? JSON.parse(currentUserStr).username : "";

        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            var displayedIndex = ((page - 1) * limit) + i + 1;

            var isSelf = (row.username === currentUser);
            var deleteDisabled = isSelf ? "disabled" : "";

            var actionsHTML =
                "<div class='btn-group btn-group-sm' role='group'>" +
                "<button class='btn btn-warning table-action-btn' title='Edit Admin' onclick='showModalEditAdmin(" + i + ")'><i class='fas fa-edit text-white'></i></button>" +
                "<button class='btn btn-info table-action-btn' title='Reset Password' onclick='resetPasswordAdminDialog(\"" + row.rowIndex + "\", \"" + escapeHTML(row.username) + "\")'><i class='fas fa-key text-white'></i></button>" +
                "<button class='btn btn-danger table-action-btn' title='Hapus Admin' " + deleteDisabled + " onclick='hapusDataAdmin(\"" + row.rowIndex + "\", \"" + escapeHTML(row.username) + "\")'><i class='fas fa-trash-alt'></i></button>" +
                "</div>";

            htmlContent.push(
                "<tr>" +
                "<td>" + displayedIndex + "</td>" +
                "<td><span class='badge bg-primary'>" + escapeHTML(row.username) + "</span></td>" +
                "<td class='fw-bold text-dark'>" + escapeHTML(row.nama) + "</td>" +
                "<td>" + escapeHTML(row.jabatan) + "</td>" +
                "<td>" + escapeHTML(row.bidang) + "</td>" +
                "<td><span style='display:inline-block; max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;' title='" + escapeHTML(row.aksesKategori) + "'>" + escapeHTML(row.aksesKategori) + "</span></td>" +
                "<td><span style='display:inline-block; max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;' title='" + escapeHTML(row.aksesJenjang) + "'>" + escapeHTML(row.aksesJenjang) + "</span></td>" +
                "<td>" + actionsHTML + "</td>" +
                "</tr>"
            );
        }
        tableBody.innerHTML = htmlContent.join("");

        var startItem = ((page - 1) * limit) + 1;
        var endItem = startItem + data.length - 1;
        document.getElementById('infoDataAdmin').innerText = "Menampilkan " + startItem + " - " + endItem + " dari " + total + " data";
        renderPaginationAdminUI(total, page, limit);
    }
}

function renderPaginationAdminUI(total, currentPage, limit) {
    var ul = document.getElementById('paginationDataAdmin');
    if (!ul) return;
    ul.innerHTML = '';

    var totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return;

    var prevDisabled = (currentPage === 1) ? 'disabled' : '';
    ul.insertAdjacentHTML('beforeend', `<li class="page-item ${prevDisabled}"><a class="page-link" href="#" onclick="event.preventDefault(); if(${currentPage} > 1) goToPageAdmin(${currentPage - 1})">Prev</a></li>`);

    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, currentPage + 2);

    if (endPage - startPage < 4) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + 4);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, endPage - 4);
        }
    }

    for (var i = startPage; i <= endPage; i++) {
        var activeClass = (i === currentPage) ? 'active' : '';
        ul.insertAdjacentHTML('beforeend', `<li class="page-item ${activeClass}"><a class="page-link" href="#" onclick="event.preventDefault(); goToPageAdmin(${i})">${i}</a></li>`);
    }

    var nextDisabled = (currentPage === totalPages) ? 'disabled' : '';
    ul.insertAdjacentHTML('beforeend', `<li class="page-item ${nextDisabled}"><a class="page-link" href="#" onclick="event.preventDefault(); if(${currentPage} < ${totalPages}) goToPageAdmin(${currentPage + 1})">Next</a></li>`);
}

// --- FUNGSI HAPUS ADMIN ---
function hapusDataAdmin(rowIndex, username) {
    Swal.fire({
        title: 'Apakah Anda yakin?',
        html: 'Menghapus data admin <b>' + username + '</b> tidak dapat dibatalkan.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74a3b',
        cancelButtonColor: '#858796',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(function () {
                        Swal.fire('Terhapus!', 'Data admin berhasil dihapus.', 'success');
                        loadDataAdminPaginated();
                    })
                    .withFailureHandler(function (error) {
                        Swal.fire('Error!', 'Gagal menghapus admin: ' + error.message, 'error');
                    })
                    .deleteDataAdmin(sessionStorage.getItem('authToken'), rowIndex);
            }
        }
    });
}

// --- FUNGSI TAMBAH ADMIN ---
function showModalTambahAdmin() {
    document.getElementById('formTambahAdmin').reset();
    var modal = new bootstrap.Modal(document.getElementById('modalTambahAdmin'));
    modal.show();
}

function simpanDataAdmin() {
    var username = document.getElementById('addAdminUsername').value.trim();
    var password = document.getElementById('addAdminPassword').value.trim();

    if (!username || !password) {
        Swal.fire('Peringatan', 'Username dan Password wajib diisi!', 'warning');
        return;
    }

    var aksesKategoriList = [];
    var katCheckboxes = document.querySelectorAll('#formTambahAdmin .akses-kategori:checked');
    for (var i = 0; i < katCheckboxes.length; i++) {
        aksesKategoriList.push(katCheckboxes[i].value);
    }
    var aksesJenjangList = [];
    var jenCheckboxes = document.querySelectorAll('#formTambahAdmin .akses-jenjang:checked');
    for (var i = 0; i < jenCheckboxes.length; i++) {
        aksesJenjangList.push(jenCheckboxes[i].value);
    }

    var adminData = {
        username: username,
        password: password,
        nama: document.getElementById('addAdminNama') ? document.getElementById('addAdminNama').value.trim() : "",
        bidang: document.getElementById('addAdminBidang') ? document.getElementById('addAdminBidang').value.trim() : "",
        npsn: "",
        sekolah: "",
        jenjang: aksesJenjangList.join(', '),
        statusSekolah: "",
        kecamatan: "",
        jabatan: document.getElementById('addAdminJabatan') ? document.getElementById('addAdminJabatan').value.trim() : "Admin",
        aksesKategori: aksesKategoriList.join(', '),
        aksesJenjang: aksesJenjangList.join(', ')
    };

    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(function () {
                Swal.fire('Sukses!', 'Data admin berhasil ditambahkan.', 'success');
                var modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalTambahAdmin'));
                if (modalInstance) modalInstance.hide();
                currentPageAdmin = 1;
                loadDataAdminPaginated();
            })
            .withFailureHandler(function (error) {
                Swal.fire('Error!', 'Gagal menambah admin: ' + error.message, 'error');
            })
            .addDataAdmin(sessionStorage.getItem('authToken'), adminData);
    }
}

// --- FUNGSI EDIT ADMIN ---
function showModalEditAdmin(arrayIndex) {
    var row = currentDataAdmin[arrayIndex];
    if (!row) return;

    document.getElementById('formEditAdmin').reset();
    document.getElementById('editAdminRowIndex').value = row.rowIndex;
    document.getElementById('editAdminUsername').value = row.username;
    document.getElementById('editAdminNama').value = row.nama;
    if (document.getElementById('editAdminJabatan')) document.getElementById('editAdminJabatan').value = row.jabatan || 'Admin';
    if (document.getElementById('editAdminBidang')) document.getElementById('editAdminBidang').value = row.bidang || '';

    var katCheckboxes = document.querySelectorAll('#formEditAdmin .edit-akses-kategori');
    for (var i = 0; i < katCheckboxes.length; i++) {
        katCheckboxes[i].checked = row.aksesKategori && row.aksesKategori.indexOf(katCheckboxes[i].value) !== -1;
    }
    var jenCheckboxes = document.querySelectorAll('#formEditAdmin .edit-akses-jenjang');
    for (var i = 0; i < jenCheckboxes.length; i++) {
        jenCheckboxes[i].checked = row.aksesJenjang && row.aksesJenjang.indexOf(jenCheckboxes[i].value) !== -1;
    }

    var modal = new bootstrap.Modal(document.getElementById('modalEditAdmin'));
    modal.show();
}

function simpanEditAdmin() {
    var rowIndex = document.getElementById('editAdminRowIndex').value;
    var username = document.getElementById('editAdminUsername').value.trim();

    if (!username) {
        Swal.fire('Peringatan', 'Username wajib diisi!', 'warning');
        return;
    }

    var aksesKategoriList = [];
    var katCheckboxes = document.querySelectorAll('#formEditAdmin .edit-akses-kategori:checked');
    for (var i = 0; i < katCheckboxes.length; i++) {
        aksesKategoriList.push(katCheckboxes[i].value);
    }
    var aksesJenjangList = [];
    var jenCheckboxes = document.querySelectorAll('#formEditAdmin .edit-akses-jenjang:checked');
    for (var i = 0; i < jenCheckboxes.length; i++) {
        aksesJenjangList.push(jenCheckboxes[i].value);
    }

    var adminData = {
        username: username,
        nama: document.getElementById('editAdminNama') ? document.getElementById('editAdminNama').value.trim() : "",
        bidang: document.getElementById('editAdminBidang') ? document.getElementById('editAdminBidang').value.trim() : "",
        npsn: "",
        sekolah: "",
        jenjang: aksesJenjangList.join(', '),
        statusSekolah: "",
        kecamatan: "",
        jabatan: document.getElementById('editAdminJabatan') ? document.getElementById('editAdminJabatan').value.trim() : "Admin",
        aksesKategori: aksesKategoriList.join(', '),
        aksesJenjang: aksesJenjangList.join(', ')
    };

    Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(function () {
                Swal.fire('Sukses!', 'Data admin berhasil diperbarui.', 'success');
                var modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalEditAdmin'));
                if (modalInstance) modalInstance.hide();
                loadDataAdminPaginated();
            })
            .withFailureHandler(function (error) {
                Swal.fire('Error!', 'Gagal mengubah admin: ' + error.message, 'error');
            })
            .updateDataAdmin(sessionStorage.getItem('authToken'), rowIndex, adminData);
    }
}

// --- FUNGSI RESET PASSWORD ADMIN ---
function resetPasswordAdminDialog(rowIndex, username) {
    Swal.fire({
        title: 'Reset Password Admin',
        html: `Masukkan password baru untuk admin <b>${username}</b>`,
        input: 'text',
        inputAttributes: { autocapitalize: 'off' },
        showCancelButton: true,
        confirmButtonText: 'Simpan',
        cancelButtonText: 'Batal',
        showLoaderOnConfirm: true,
        preConfirm: (newPassword) => {
            if (!newPassword) {
                Swal.showValidationMessage('Password baru tidak boleh kosong');
                return false;
            }
            return new Promise((resolve, reject) => {
                if (typeof google !== 'undefined' && google.script) {
                    google.script.run
                        .withSuccessHandler(function () { resolve(true); })
                        .withFailureHandler(function (error) { reject(new Error(error.message)); })
                        .resetPasswordAdmin(sessionStorage.getItem('authToken'), rowIndex, newPassword);
                }
            }).catch(error => { Swal.showValidationMessage(`Gagal mereset: ${error.message}`); });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'Tersimpan!', text: 'Password berhasil direset.', icon: 'success' });
        }
    });
}
// --- MANAJEMEN KATEGORI LAYANAN ---
var currentKategori = [];

function loadKategoriLayanan() {
    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(function (data) {
                currentKategori = data;
                renderCheckboxKategori(data, 'containerAksesKategori', 'aksesKat', 'akses-kategori');
                renderCheckboxKategori(data, 'containerEditAksesKategori', 'editAksesKat', 'edit-akses-kategori');
                renderTableKategori(data);
            })
            .withFailureHandler(function (error) {
                console.error('Gagal memuat kategori:', error);
            })
            .getKategoriLayanan();
    }
}

function renderCheckboxKategori(data, containerId, idPrefix, className) {
    var container = document.getElementById(containerId);
    if (!container) return;

    if (data.length === 0) {
        container.innerHTML = '<div class="col-12 text-muted fst-italic"><small>Tidak ada kategori.</small></div>';
        return;
    }

    var half = Math.ceil(data.length / 2);
    var col1 = '<div class="col-md-6">';
    var col2 = '<div class="col-md-6">';

    data.forEach(function (item, index) {
        var html = '<div class="form-check">' +
            '<input class="form-check-input ' + className + '" type="checkbox" value="' + escapeHTML(item.nama) + '" id="' + idPrefix + index + '">' +
            '<label class="form-check-label" for="' + idPrefix + index + '"><small>' + escapeHTML(item.nama) + '</small></label>' +
            '</div>';
        if (index < half) col1 += html;
        else col2 += html;
    });

    col1 += '</div>';
    col2 += '</div>';
    container.innerHTML = col1 + col2;
}

function showModalKelolaKategori() {
    var myModal = new bootstrap.Modal(document.getElementById('modalKelolaKategori'));
    myModal.show();
}

function renderTableKategori(data) {
    var tbody = document.getElementById('bodyTableKategori');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Belum ada kategori.</td></tr>';
        return;
    }

    var html = '';
    data.forEach(function (item, i) {
        html += '<tr>' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + escapeHTML(item.nama) + '</td>' +
            '<td>' +
            '<button class="btn btn-sm btn-danger" onclick="hapusKategoriLayananUI(' + item.rowIndex + ')"><i class="fas fa-trash"></i> Hapus</button>' +
            '</td>' +
            '</tr>';
    });
    tbody.innerHTML = html;
}

function tambahKategoriBaru(event) {
    var input = document.getElementById('inputNamaKategori');
    var nama = input.value.trim();
    if (!nama) {
        Swal.fire('Peringatan', 'Nama kategori tidak boleh kosong!', 'warning');
        return;
    }

    var btn = event.currentTarget;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    if (typeof google !== 'undefined' && google.script) {
        google.script.run
            .withSuccessHandler(function (res) {
                if (res.success) {
                    input.value = '';
                    loadKategoriLayanan();
                } else {
                    Swal.fire('Gagal', res.message, 'error');
                }
                btn.disabled = false;
                btn.innerHTML = 'Tambah';
            })
            .withFailureHandler(function (error) {
                Swal.fire('Gagal', error.message, 'error');
                btn.disabled = false;
                btn.innerHTML = 'Tambah';
            })
            .simpanKategoriLayanan(sessionStorage.getItem('authToken'), null, nama);
    }
}

function hapusKategoriLayananUI(rowIndex) {
    Swal.fire({
        title: 'Hapus Kategori?',
        text: "Kategori ini akan dihapus dari sistem.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(function (res) {
                        if (res.success) {
                            loadKategoriLayanan();
                        } else {
                            Swal.fire('Gagal', res.message, 'error');
                        }
                    })
                    .withFailureHandler(function (error) {
                        Swal.fire('Gagal', error.message, 'error');
                    })
                    .hapusKategoriLayanan(sessionStorage.getItem('authToken'), rowIndex);
            }
        }
    });
}


// Panggil loadKategoriLayanan() saat memuat DOM (admin interface)
window.addEventListener('DOMContentLoaded', function () {
    loadKategoriLayanan();
});
