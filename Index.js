
// Blokir akses jika belum login
var token = sessionStorage.getItem('authToken');
if (sessionStorage.getItem('isLoggedIn') !== 'true' || !token) {
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

    let dataTableRiwayat = null;

    // Elemen Navigasi & Section
    const menus = {
        dashboard: document.getElementById('menuDashboard'),
        form: document.getElementById('menuFormPengajuan'),
        riwayat: document.getElementById('menuRiwayat'),
        profil: document.getElementById('menuProfil'),
        pendataan: document.getElementById('menuPendataanBaru'),
        unduhan: document.getElementById('menuPusatUnduhan')
    };

    const sections = {
        dashboard: document.getElementById('sectionDashboard'),
        form: document.getElementById('sectionFormPengajuan'),
        riwayat: document.getElementById('sectionRiwayat'),
        profil: document.getElementById('sectionProfil'),
        pendataan: document.getElementById('sectionPendataanBaru'),
        unduhan: document.getElementById('sectionPusatUnduhan')
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
    }

    // Event Listener Menu
    menus.dashboard.addEventListener('click', (e) => { e.preventDefault(); switchView('dashboard'); });
    menus.form.addEventListener('click', (e) => { e.preventDefault(); switchView('form'); });
    menus.riwayat.addEventListener('click', (e) => { e.preventDefault(); switchView('riwayat'); });
    menus.profil.addEventListener('click', (e) => { e.preventDefault(); switchView('profil'); });
    menus.pendataan.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('pendataan');
        loadFormPendataan(); // Trigger fetch form saat diklik
    });
    menus.unduhan.addEventListener('click', (e) => { e.preventDefault(); switchView('unduhan'); });

    var userDataStr = sessionStorage.getItem('userData');
    if (userDataStr) {
        try {
            var user = JSON.parse(userDataStr);

            // Set Navbar Name
            var navName = document.getElementById('navbarUserName');
            if (navName) navName.innerText = user.nama || user.name || "";

            // Set Form Readonly Pengajuan
            document.getElementById('namaLengkap').value = user.nama || user.name || "";
            document.getElementById('jabatan').value = user.jabatan || user.role || "";
            document.getElementById('npsn').value = user.npsn || "";
            document.getElementById('satuanPendidikan').value = user.sekolah || "";
            document.getElementById('jenjang').value = user.jenjang || "";
            document.getElementById('statusSekolah').value = user.status_sekolah || "";
            document.getElementById('kecamatan').value = user.kecamatan || "";

            // Set Info Profil UI
            document.getElementById('profilNama').innerText = user.nama || user.name || "Nama Tidak Tersedia";
            document.getElementById('profilJabatan').innerText = user.jabatan || user.role || "-";
            document.getElementById('profilSekolah').innerText = user.sekolah || "-";
            document.getElementById('profilInfoNPSN').innerText = user.npsn || "-";

            var elKecamatan = document.getElementById('profilKecamatan');
            if (elKecamatan) elKecamatan.innerText = user.kecamatan || "-";

            // Set Nilai Input untuk Form Edit Profil
            var elEditNama = document.getElementById('editNama');
            if (elEditNama) elEditNama.value = user.nama || user.name || "";

            // Set Username untuk Ubah Password 
            document.getElementById('profilUsername').value = user.username || user.npsn || "";

            // Muat Data Awal Dashboard secara bersamaan (Notifikasi, Riwayat, Kategori)
            loadInitialData(user.npsn || "");

        } catch (e) {
            console.error("Gagal memparsing data user:", e);
        }
    }

    // Fungsi Memuat Data Awal Secara Bersamaan
    function loadInitialData(npsn) {
        var tableBody = document.getElementById('bodyTabelRiwayat');
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-primary"><i class="fas fa-spinner fa-spin me-2"></i>Memuat data awal...</td></tr>';
        var select = document.getElementById('layananPendidikan');
        if (select) select.innerHTML = '<option value="" disabled selected>-- Memuat Layanan... --</option>';

        if (typeof google !== 'undefined' && google.script) {
            google.script.run
                .withSuccessHandler(function (response) {
                    if (response.success) {
                        // 1. Notifikasi Pendataan
                        var notifContainer = document.getElementById('notifikasiPendataanDashboard');
                        if (response.pendataan && response.pendataan.success && response.pendataan.idForm) {
                            notifContainer.innerHTML = `
                                    <div class="alert alert-danger shadow-sm border-0 d-flex align-items-center" style="border-left: 5px solid #dc3545 !important;">
                                        <div class="me-3">
                                            <i class="fas fa-bullhorn fs-2 text-danger"></i>
                                        </div>
                                        <div class="flex-grow-1">
                                            <h6 class="fw-bold mb-1">Informasi Pendataan Baru!</h6>
                                            <p class="mb-1 small">Super Admin telah merilis pendataan baru: <strong>${escapeHTML(response.pendataan.judul || 'Formulir Pendataan')}</strong></p>
                                            <p class="mb-0 small text-muted fst-italic">${escapeHTML(response.pendataan.deskripsi || 'Tidak ada deskripsi.')}</p>
                                        </div>
                                        <div class="ms-3">
                                            <button class="btn btn-danger text-white btn-sm px-3 shadow-sm" onclick="document.getElementById('menuPendataanBaru').click();">
                                                Isi Sekarang <i class="fas fa-arrow-right ms-1"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                            notifContainer.classList.remove('d-none');
                        } else {
                            notifContainer.classList.add('d-none');
                            notifContainer.innerHTML = '';
                        }

                        // 2. Riwayat Pengajuan
                        renderTabelRiwayat(response.riwayat || []);

                        // 3. Kategori Layanan
                        if (select) {
                            var html = '<option value="" disabled selected>-- Pilih Layanan Pendidikan --</option>';
                            if (response.kategori && response.kategori.length > 0) {
                                response.kategori.forEach(function (item) {
                                    html += '<option value="' + escapeHTML(item.nama) + '">' + escapeHTML(item.nama) + '</option>';
                                });
                            } else {
                                html = '<option value="" disabled selected>-- Kategori belum tersedia --</option>';
                            }
                            select.innerHTML = html;
                        }
                    } else {
                        if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger"><i class="fas fa-exclamation-triangle me-1"></i> Gagal memuat data: ' + escapeHTML(response.message) + '</td></tr>';
                        if (select) select.innerHTML = '<option value="" disabled selected>-- Gagal memuat kategori --</option>';
                    }
                })
                .withFailureHandler(function (err) {
                    if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger"><i class="fas fa-exclamation-triangle me-1"></i> Gagal memuat data.</td></tr>';
                    if (select) select.innerHTML = '<option value="" disabled selected>-- Gagal memuat kategori --</option>';
                })
                .getInitialUserDashboardData(sessionStorage.getItem('authToken'), npsn);
        } else {
            setTimeout(() => { if (tableBody) tableBody.innerHTML = '<tr id="rowKosong"><td colspan="6" class="text-center text-muted fst-italic">Mode Preview Aktif.</td></tr>'; }, 1000);
        }
    }

    // Render Tabel dan Dashboard
    function renderTabelRiwayat(data) {
        if (dataTableRiwayat) {
            dataTableRiwayat.destroy();
            dataTableRiwayat = null;
        }

        var tableBody = document.getElementById('bodyTabelRiwayat');
        tableBody.innerHTML = '';

        let total = 0, menunggu = 0, disetujui = 0, ditolak = 0;

        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr id="rowKosong"><td colspan="6" class="text-center text-muted fst-italic">Belum ada riwayat pengajuan.</td></tr>';
        } else {
            total = data.length;
            let htmlRows = [];
            data.forEach(function (item, index) {
                var statusText = (item.status || "Menunggu Verifikasi").toLowerCase();
                var badgeClass = "bg-warning text-dark";

                if (statusText.includes("selesai") || statusText.includes("setuju")) { badgeClass = "bg-success"; disetujui++; }
                else if (statusText.includes("tolak") || statusText.includes("batal")) { badgeClass = "bg-danger"; ditolak++; }
                else { menunggu++; }

                var statusHtml = `<span class="badge ${badgeClass}">${item.status || "Menunggu Verifikasi"}</span>`;

                if (item.alasanTolak) {
                    statusHtml += `<div class="small text-danger mt-1 fst-italic" style="max-width: 200px;">Alasan: ${escapeHTML(item.alasanTolak)}</div>`;
                }

                htmlRows.push(`
                                <tr>
                                    <td>${index + 1}</td>
                                    <td><span class="badge bg-secondary text-white">${escapeHTML(item.idTiket || "-")}</span></td>
                                    <td>${escapeHTML(item.tanggal)}</td>
                                    <td>${escapeHTML(item.layananPendidikan)}</td>
                                    <td>${escapeHTML(item.satuanPendidikan)}</td>
                                    <td>${statusHtml}</td>
                                </tr>
                            `);
            });
            tableBody.innerHTML = htmlRows.join('');

            // Initialize DataTable
            setTimeout(() => {
                const tableEl = document.getElementById('tabelRiwayatData');
                if (tableEl) {
                    dataTableRiwayat = new simpleDatatables.DataTable(tableEl, {
                        perPage: 5,
                        perPageSelect: [5, 10, 20, 50],
                        searchable: true,
                        sortable: true,
                        labels: {
                            placeholder: "Cari berdasarkan NPSN...",
                            perPage: "data per halaman",
                            noRows: "Tidak ada data riwayat.",
                            info: "Menampilkan {start} - {end} dari {rows} data"
                        }
                    });
                }
            }, 50);
        }

        if (document.getElementById('countTotal')) document.getElementById('countTotal').innerText = total;
        if (document.getElementById('countMenunggu')) document.getElementById('countMenunggu').innerText = menunggu;
        if (document.getElementById('countDisetujui')) document.getElementById('countDisetujui').innerText = disetujui;
        if (document.getElementById('countDitolak')) document.getElementById('countDitolak').innerText = ditolak;
    }

    // ==========================================
    // EVENT LISTENER: REFRESH RIWAYAT
    // ==========================================
    const btnRefreshRiwayat = document.getElementById('btnRefreshRiwayat');
    if (btnRefreshRiwayat) {
        btnRefreshRiwayat.addEventListener('click', function (e) {
            e.preventDefault();
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Menyegarkan...';

            var userStr = sessionStorage.getItem('userData');
            var npsn = "";
            if (userStr) {
                try {
                    var user = JSON.parse(userStr);
                    npsn = user.npsn || "";
                } catch (e) { }
            }

            // Panggil ulang loadInitialData
            loadInitialData(npsn);

            // Reset text tombol setelah 1.5 detik
            setTimeout(() => {
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Refresh Data';
            }, 1500);
        });
    }

    // ==========================================
    // EVENT LISTENER: SUBMIT PENGATURAN AKUN (GABUNGAN)
    // ==========================================
    document.getElementById('formPengaturanAkun').addEventListener('submit', function (e) {
        e.preventDefault();

        var username = document.getElementById('profilUsername').value;
        var newName = document.getElementById('editNama').value;
        var oldPass = document.getElementById('oldPassword').value;
        var newPass = document.getElementById('newPassword').value;
        var confirmPass = document.getElementById('confirmPassword').value;
        var errText = document.getElementById('passwordError');

        if (!username) {
            Swal.fire('Akses Ditolak', 'Identitas username tidak ditemukan. Harap login kembali.', 'warning');
            return;
        }

        // Cek apakah user sedang mencoba merubah password (salah satu field terisi)
        var isChangingPassword = oldPass !== "" || newPass !== "" || confirmPass !== "";

        if (isChangingPassword) {
            // Validasi kekosongan field password jika salah satu diisi
            if (!oldPass || !newPass || !confirmPass) {
                Swal.fire('Perhatian', 'Untuk mengubah password, harap lengkapi Password Lama, Password Baru, dan Konfirmasi Password!', 'warning');
                return;
            }
            // Validasi kecocokan Konfirmasi Password
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
            // PROSES 1: SIMPAN PROFIL (NAMA)
            google.script.run
                .withSuccessHandler(function (nameResponse) {
                    if (nameResponse.success) {

                        // Live Update UI Nama di Layar
                        var userStr = sessionStorage.getItem('userData');
                        if (userStr) {
                            var userObj = JSON.parse(userStr);
                            userObj.nama = nameResponse.newName;
                            sessionStorage.setItem('userData', JSON.stringify(userObj));
                        }
                        document.getElementById('profilNama').innerText = nameResponse.newName;
                        var navName = document.getElementById('navbarUserName');
                        if (navName) navName.innerText = nameResponse.newName;
                        var fieldNama = document.getElementById('namaLengkap');
                        if (fieldNama) fieldNama.value = nameResponse.newName;

                        // PROSES 2: JIKA USER INGIN MENGUBAH PASSWORD, JALANKAN INI
                        if (isChangingPassword) {
                            google.script.run
                                .withSuccessHandler(function (passResponse) {
                                    btn.disabled = false;
                                    btn.innerHTML = originalText;

                                    if (passResponse.success) {
                                        document.getElementById('oldPassword').value = '';
                                        document.getElementById('newPassword').value = '';
                                        document.getElementById('confirmPassword').value = '';

                                        Swal.fire({
                                            title: 'Pembaruan Berhasil!',
                                            text: 'Profil dan Password Anda berhasil diperbarui! Silakan login kembali dengan password baru Anda.',
                                            icon: 'success',
                                            confirmButtonText: 'Login Kembali',
                                            allowOutsideClick: false
                                        }).then((result) => {
                                            if (result.isConfirmed) logoutApp();
                                        });
                                    } else {
                                        Swal.fire('Gagal Mengubah Password', passResponse.message, 'error');
                                    }
                                })
                                .withFailureHandler(function (error) {
                                    btn.disabled = false;
                                    btn.innerHTML = originalText;
                                    Swal.fire('Error Sistem', 'Profil tersimpan, namun terjadi kesalahan server saat merubah password.', 'error');
                                })
                                .changeUserPassword(sessionStorage.getItem('authToken'), username, oldPass, newPass);
                        } else {
                            // JIKA USER HANYA MENGUBAH NAMA (TANPA PASSWORD)
                            btn.disabled = false;
                            btn.innerHTML = originalText;
                            Swal.fire('Berhasil!', nameResponse.message, 'success');
                        }

                    } else {
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                        Swal.fire('Gagal Memperbarui Profil', nameResponse.message, 'error');
                    }
                })
                .withFailureHandler(function (error) {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    Swal.fire('Error Sistem', 'Terjadi kesalahan saat menghubungi server.', 'error');
                })
                .changeUserName(sessionStorage.getItem('authToken'), username, newName);

        } else {
            // Mode Preview (Lokal Tanpa Google Script)
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                document.getElementById('profilNama').innerText = newName;

                if (isChangingPassword) {
                    Swal.fire({
                        title: 'Mode Preview',
                        text: 'Simulasi Profil dan Password diubah. Mengarahkan ke halaman login...',
                        icon: 'info',
                        confirmButtonText: 'OK',
                        allowOutsideClick: false
                    }).then((result) => {
                        if (result.isConfirmed) logoutApp();
                    });
                } else {
                    Swal.fire('Preview Mode', 'Nama Profil berhasil diperbarui (Simulasi)', 'success');
                }
            }, 1200);
        }
    });

    // Validasi Real-time Konfirmasi Password
    document.getElementById('confirmPassword').addEventListener('input', function () {
        var newPass = document.getElementById('newPassword').value;
        var errText = document.getElementById('passwordError');
        if (this.value !== newPass && this.value !== "") {
            errText.classList.remove('d-none');
        } else {
            errText.classList.add('d-none');
        }
    });

    document.getElementById('formPengajuan').addEventListener('submit', function (e) {
        e.preventDefault();

        var dataPengajuan = {
            namaLengkap: document.getElementById('namaLengkap').value,
            jabatan: document.getElementById('jabatan').value,
            npsn: document.getElementById('npsn').value,
            satuanPendidikan: document.getElementById('satuanPendidikan').value,
            jenjang: document.getElementById('jenjang').value,
            statusSekolah: document.getElementById('statusSekolah').value,
            kecamatan: document.getElementById('kecamatan').value,
            layananPendidikan: document.getElementById('layananPendidikan').value,
            keterangan: document.getElementById('keterangan').value,
            tautanDokumen: document.getElementById('tautanDokumen').value
        };

        var btnSubmit = document.getElementById('btnSubmitPengajuan');
        var originalBtnText = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Sedang Mengirim...';

        if (typeof google !== 'undefined' && google.script) {
            google.script.run
                .withSuccessHandler(function (response) {
                    document.getElementById('layananPendidikan').selectedIndex = 0;
                    document.getElementById('keterangan').value = "";
                    document.getElementById('tautanDokumen').value = "";
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = originalBtnText;

                    Swal.fire({
                        title: 'Berhasil!',
                        html: `Pengajuan berhasil dikirim!<br><br><b>ID Tiket: <span class="text-primary fs-5">${response.idTiket}</span></b>`,
                        icon: 'success',
                        confirmButtonText: 'Cek Riwayat',
                        allowOutsideClick: false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            setTimeout(() => {
                                document.getElementById('menuRiwayat').click();
                                loadRiwayatPengajuan(dataPengajuan.npsn);
                            }, 300);
                        }
                    });
                })
                .withFailureHandler(function (error) {
                    var errMsg = error.message || error;
                    Swal.fire('Gagal!', errMsg, 'error');
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = originalBtnText;
                })
                .simpanPengajuan(sessionStorage.getItem('authToken'), dataPengajuan);
        } else {
            // Preview lokal
            setTimeout(() => {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnText;
                Swal.fire({
                    title: 'Preview',
                    text: 'Simulasi data terkirim',
                    icon: 'info',
                    confirmButtonText: 'Cek Riwayat',
                    allowOutsideClick: false
                }).then((result) => {
                    if (result.isConfirmed) {
                        setTimeout(() => {
                            document.getElementById('menuRiwayat').click();
                        }, 300);
                    }
                });
            }, 1000);
        }
    });
    // ==========================================
    // DYNAMIC FORM RENDERER & SUBMIT LOGIC
    // ==========================================
    let currentFormId = null;

    function loadFormPendataan() {
        document.getElementById('loadingPendataan').classList.remove('d-none');
        document.getElementById('errorPendataan').classList.add('d-none');
        document.getElementById('formPendataanContainer').classList.add('d-none');

        if (typeof google !== 'undefined' && google.script) {
            google.script.run
                .withSuccessHandler(function (response) {
                    document.getElementById('loadingPendataan').classList.add('d-none');
                    if (response.success) {
                        currentFormId = response.idForm;
                        const schema = JSON.parse(response.formJson);

                        const userStr = sessionStorage.getItem('userData');
                        const userObj = userStr ? JSON.parse(userStr) : {};
                        const npsn = userObj.npsn || "";

                        google.script.run
                            .withSuccessHandler(function (ansRes) {
                                let existingData = null;
                                if (ansRes.success && ansRes.hasAnswer) {
                                    existingData = ansRes.jawaban;
                                }
                                renderFormDinamic(schema, existingData);
                            })
                            .withFailureHandler(function () {
                                renderFormDinamic(schema, null);
                            })
                            .cekJawabanUser(sessionStorage.getItem('authToken'), currentFormId, npsn);

                    } else {
                        document.getElementById('errorPendataan').innerText = response.message || "Belum ada formulir aktif.";
                        document.getElementById('errorPendataan').classList.remove('d-none');
                    }
                })
                .withFailureHandler(function (error) {
                    document.getElementById('loadingPendataan').classList.add('d-none');
                    document.getElementById('errorPendataan').innerText = "Gagal memuat formulir: " + error.message;
                    document.getElementById('errorPendataan').classList.remove('d-none');
                })
                .getFormPendataanAktif(sessionStorage.getItem('authToken'));
        } else {
            // Simulasi Lokal
            setTimeout(() => {
                document.getElementById('loadingPendataan').classList.add('d-none');
                document.getElementById('errorPendataan').innerText = "Mode preview: Koneksi backend terputus.";
                document.getElementById('errorPendataan').classList.remove('d-none');
            }, 1000);
        }
    }

    function renderFormDinamic(schema, existingData = null) {
        document.getElementById('formPendataanContainer').classList.remove('d-none');
        document.getElementById('judulPendataan').innerText = schema.title || 'Formulir Tanpa Judul';
        document.getElementById('deskripsiPendataan').innerText = schema.description || '';

        const container = document.getElementById('dynamicQuestionsContainer');
        container.innerHTML = ''; // Kosongkan form lama

        const btnSubmit = document.getElementById('btnSubmitPendataan');
        if (btnSubmit) {
            // Bersihkan state tombol submit
            btnSubmit.disabled = false;
            btnSubmit.style.backgroundColor = '#4747a1';
            btnSubmit.style.borderColor = '#4747a1';
            btnSubmit.classList.remove('btn-success');
            btnSubmit.classList.add('text-white');
            btnSubmit.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Kirim Form';

            const oldEdit = document.getElementById('btnEditPendataan');
            if (oldEdit) oldEdit.remove();

            if (existingData) {
                btnSubmit.innerHTML = '<i class="fas fa-check-circle me-2"></i>Sudah Kirim';
                btnSubmit.style.backgroundColor = '#28a745';
                btnSubmit.style.borderColor = '#28a745';
                btnSubmit.disabled = true;

                // Tambahkan tombol edit
                const editBtn = document.createElement('button');
                editBtn.id = 'btnEditPendataan';
                editBtn.className = 'btn btn-warning ms-2 text-dark fw-semibold';
                editBtn.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Jawaban';
                editBtn.type = 'button';
                editBtn.onclick = function () {
                    btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>Simpan Perubahan';
                    btnSubmit.disabled = false;
                    btnSubmit.style.backgroundColor = '';
                    btnSubmit.style.borderColor = '';
                    btnSubmit.classList.add('btn-success');

                    // Enable all inputs in the form
                    const inputs = document.getElementById('dynamicFormPendataan').querySelectorAll('input, select, textarea');
                    inputs.forEach(el => el.disabled = false);

                    this.remove();
                };
                btnSubmit.parentNode.appendChild(editBtn);

                // Tambahkan banner peringatan
                container.insertAdjacentHTML('beforeend', `
                            <div class="alert alert-warning shadow-sm border-0 d-flex align-items-center mb-4" style="border-radius: 8px;">
                                <i class="fas fa-info-circle fs-4 me-3 text-warning"></i>
                                <div>
                                    <h6 class="fw-bold mb-1">Anda sudah mengisi formulir ini!</h6>
                                    <p class="mb-0 small">Data di bawah ini adalah isian Anda sebelumnya. Anda dapat mengubah dan menyimpannya kembali dengan menekan Edit Jawaban.</p>
                                </div>
                            </div>
                        `);
            }
        }

        if (!schema.questions || schema.questions.length === 0) {
            container.innerHTML += '<div class="alert alert-info">Tidak ada pertanyaan pada formulir ini.</div>';
            return;
        }

        schema.questions.forEach((q, index) => {
            const qId = 'ans_' + index;
            const isRequired = q.required ? 'required' : '';
            const reqAsterisk = q.required ? '<span class="text-danger ms-1">*</span>' : '';

            // Ambil value sebelumnya jika ada
            let prevVal = "";
            if (existingData && existingData[qId] !== undefined) {
                prevVal = existingData[qId];
            }

            let inputHtml = '';

            if (q.type === 'short') {
                inputHtml = `<input type="text" class="form-control border-top-0 border-end-0 border-start-0 rounded-0 px-0 shadow-none" style="border-bottom: 1px solid #ced4da;" id="${qId}" name="${qId}" placeholder="Jawaban Anda" value="${prevVal}" ${isRequired}>`;
            } else if (q.type === 'paragraph') {
                inputHtml = `<textarea class="form-control border-top-0 border-end-0 border-start-0 rounded-0 px-0 shadow-none" style="border-bottom: 1px solid #ced4da; resize: vertical;" id="${qId}" name="${qId}" rows="2" placeholder="Jawaban Anda" ${isRequired}>${prevVal}</textarea>`;
            } else if (q.type === 'number') {
                inputHtml = `<input type="number" class="form-control border-top-0 border-end-0 border-start-0 rounded-0 px-0 shadow-none w-50" style="border-bottom: 1px solid #ced4da;" id="${qId}" name="${qId}" placeholder="Angka" value="${prevVal}" ${isRequired}>`;
            } else if (q.type === 'date') {
                inputHtml = `<input type="date" class="form-control border-top-0 border-end-0 border-start-0 rounded-0 px-0 shadow-none w-50" style="border-bottom: 1px solid #ced4da;" id="${qId}" name="${qId}" value="${prevVal}" ${isRequired}>`;
            } else if (q.type === 'dropdown') {
                inputHtml = `<select class="form-select border-top-0 border-end-0 border-start-0 rounded-0 px-0 shadow-none" style="border-bottom: 1px solid #ced4da;" id="${qId}" name="${qId}" ${isRequired}>
                                        <option value="" disabled ${!prevVal ? 'selected' : ''}>Pilih...</option>`;
                if (q.options) {
                    q.options.forEach(opt => {
                        const selected = (opt === prevVal) ? 'selected' : '';
                        inputHtml += `<option value="${opt}" ${selected}>${opt}</option>`;
                    });
                }
                inputHtml += `</select>`;
            } else if (q.type === 'radio') {
                inputHtml = `<div class="d-flex flex-column gap-2 mt-2">`;
                if (q.options) {
                    q.options.forEach((opt, oIndex) => {
                        const checked = (opt === prevVal) ? 'checked' : '';
                        inputHtml += `
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="${qId}" id="${qId}_opt_${oIndex}" value="${opt}" ${checked} ${isRequired}>
                                    <label class="form-check-label" for="${qId}_opt_${oIndex}">${opt}</label>
                                </div>`;
                    });
                }
                inputHtml += `</div>`;
            } else if (q.type === 'checkbox') {
                inputHtml = `<div class="d-flex flex-column gap-2 mt-2" id="${qId}">`;
                let prevArr = [];
                if (typeof prevVal === 'string') {
                    prevArr = prevVal.split(', ');
                }
                if (q.options) {
                    q.options.forEach((opt, oIndex) => {
                        const checked = prevArr.includes(opt) ? 'checked' : '';
                        inputHtml += `
                                <div class="form-check">
                                    <input class="form-check-input checkbox-group-${qId}" type="checkbox" name="${qId}" id="${qId}_opt_${oIndex}" value="${opt}" ${checked}>
                                    <label class="form-check-label" for="${qId}_opt_${oIndex}">${opt}</label>
                                </div>`;
                    });
                }
                if (q.required) {
                    inputHtml += `<input type="hidden" id="${qId}_required" value="true">`;
                }
                inputHtml += `</div>`;
            }

            const cardHtml = `
                        <div class="card border-0 shadow-sm mb-3" style="border-radius: 8px;">
                            <div class="card-body p-3 p-md-4">
                                <label class="form-label fw-bold mb-2 text-dark" style="font-size: 0.9rem;">
                                    ${q.title} ${reqAsterisk}
                                </label>
                                <div class="question-input-wrapper mt-1">
                                    ${inputHtml}
                                </div>
                            </div>
                        </div>
                    `;
            container.insertAdjacentHTML('beforeend', cardHtml);
        });

        if (existingData) {
            const inputs = document.getElementById('dynamicFormPendataan').querySelectorAll('input, select, textarea');
            inputs.forEach(el => el.disabled = true);
        }
    }

    document.getElementById('dynamicFormPendataan').addEventListener('submit', function (e) {
        e.preventDefault();

        // Custom validation for checkboxes
        let isCheckboxValid = true;
        const reqFlags = document.querySelectorAll('input[type="hidden"][id$="_required"]');
        reqFlags.forEach(flag => {
            const qId = flag.id.replace('_required', '');
            const checkboxes = document.querySelectorAll(`.checkbox-group-${qId}:checked`);
            if (checkboxes.length === 0) {
                isCheckboxValid = false;
            }
        });

        if (!isCheckboxValid) {
            Swal.fire('Perhatian', 'Mohon lengkapi semua pertanyaan yang wajib diisi.', 'warning');
            return;
        }

        Swal.fire({
            title: 'Mengirim Jawaban...',
            text: 'Mohon tunggu sebentar',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        const formData = new FormData(this);
        const jawaban = {};

        // Read all elements from form
        const formElements = this.elements;
        for (let i = 0; i < formElements.length; i++) {
            const el = formElements[i];
            if (el.name) {
                if (el.type === 'radio') {
                    if (el.checked) jawaban[el.name] = el.value;
                } else if (el.type === 'checkbox') {
                    if (!jawaban[el.name]) jawaban[el.name] = [];
                    if (el.checked) jawaban[el.name].push(el.value);
                } else {
                    jawaban[el.name] = el.value;
                }
            }
        }

        const userStr = sessionStorage.getItem('userData');
        const userObj = userStr ? JSON.parse(userStr) : {};

        const payload = {
            idForm: currentFormId,
            npsn: userObj.npsn || 'UNKNOWN',
            namaUser: userObj.nama || userObj.name || 'UNKNOWN',
            jawaban: jawaban
        };

        if (typeof google !== 'undefined' && google.script) {
            google.script.run
                .withSuccessHandler(function (response) {
                    if (response.success) {
                        Swal.fire({
                            title: 'Berhasil!',
                            text: response.message,
                            icon: 'success',
                            confirmButtonText: 'Tutup'
                        }).then(() => {
                            loadFormPendataan(); // Muat ulang agar form masuk ke mode 'Sudah Kirim' dan muncul 'Edit'
                        });
                    } else {
                        Swal.fire('Gagal', response.message, 'error');
                    }
                })
                .withFailureHandler(function (error) {
                    Swal.fire('Error', error.message, 'error');
                })
                .simpanJawabanPendataan(sessionStorage.getItem('authToken'), payload);
        } else {
            console.log("Payload yang dikirim:", JSON.stringify(payload, null, 2));
            setTimeout(() => {
                Swal.fire('Simulasi Berhasil', 'Jawaban terekam di console log.', 'success');
            }, 1000);
        }
    });

    // ==========================================
    // Kategori Layanan Dinamis kini dimuat dalam loadInitialData()
    // ==========================================
});

function logoutApp() {
    var token = sessionStorage.getItem('authToken');
    if (token && typeof google !== 'undefined' && google.script) {
        google.script.run.logoutServer(token);
    }
    sessionStorage.clear();
    if (typeof SCRIPT_URL !== 'undefined' && SCRIPT_URL) {
        window.open(SCRIPT_URL + "?page=login", "_top");
    } else if (typeof google !== 'undefined' && google.script) {
        google.script.run.withSuccessHandler(function (url) {
            window.open(url + "?page=login", "_top");
        }).getScriptUrl();
    } else {
        window.location.reload();
    }
}

// Fungsi Toggle Password Visibility
function togglePassword(inputId, btnEl) {
    var input = document.getElementById(inputId);
    var icon = btnEl.querySelector('i');
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}
