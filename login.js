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

    // Cek status login dan alihkan ke dashboard yang sesuai
    if (sessionStorage.getItem('isLoggedIn') === 'true' && sessionStorage.getItem('authToken')) {
        document.body.style.display = 'none';
        var roleInfo = (sessionStorage.getItem('userRole') || "user").toLowerCase();

        // Cek apakah user adalah admin atau super admin
        var targetPage = (roleInfo.includes('admin') || roleInfo.includes('super')) ? 'admin' : 'Index';

        if (typeof SCRIPT_URL !== 'undefined' && SCRIPT_URL) {
            window.top.location.href = SCRIPT_URL + "?page=" + targetPage;
        } else if (typeof google !== 'undefined' && google.script) {
            google.script.run.withSuccessHandler(function (url) {
                window.top.location.href = url + "?page=" + targetPage;
            }).getScriptUrl();
        } else {
            window.location.href = targetPage + ".html";
        }
    }

    function togglePassword() {
        var passwordInput = document.getElementById("inputPassword");
        var icon = document.getElementById("togglePasswordIcon");

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            passwordInput.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }

    function slideTo(target) {
        const wrapper = document.getElementById('slidingWrapper');
        if (target === 'tiket') {
            wrapper.style.transform = 'translateX(-50%)';
        } else {
            wrapper.style.transform = 'translateX(0%)';
        }

        if (target === 'login') {
            setTimeout(() => {
                document.getElementById('tiketResult').classList.add('d-none');
                document.getElementById('inputIdTiket').value = '';
            }, 500);
        }
    }

    function prosesCekTiket() {
        var idTiket = document.getElementById('inputIdTiket').value.trim();
        var btn = document.getElementById('btnCekTiket');
        var resultBox = document.getElementById('tiketResult');

        if (!idTiket) {
            Swal.fire({
                icon: 'warning',
                title: 'Perhatian',
                text: 'Harap masukkan Nomor Tiket terlebih dahulu!',
                confirmButtonColor: '#ffc107'
            });
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Mencari...';
        resultBox.classList.add('d-none');

        if (typeof google === 'undefined' || !google.script) {
            setTimeout(function () {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-search me-2"></i> Cek Status';

                document.getElementById('badgeStatus').className = 'badge bg-warning text-dark fs-6 mb-3 px-3 py-2';
                document.getElementById('badgeStatus').innerText = 'Menunggu Verifikasi (Preview)';
                document.getElementById('detailTiket').innerText = 'Perubahan Data Sekolah (Preview)';
                resultBox.classList.remove('d-none');
            }, 1500);
            return;
        }

        google.script.run
            .withSuccessHandler(function (response) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-search me-2"></i> Cek Status';

                if (response.success) {
                    var statusText = (response.data.status || "").toLowerCase();
                    var badgeClass = 'bg-warning text-dark';

                    if (statusText.includes('setuju') || statusText.includes('selesai')) badgeClass = 'bg-success';
                    else if (statusText.includes('tolak') || statusText.includes('batal')) badgeClass = 'bg-danger';

                    document.getElementById('badgeStatus').className = 'badge ' + badgeClass + ' fs-6 mb-3 px-3 py-2';
                    document.getElementById('badgeStatus').innerText = response.data.status || 'Menunggu Verifikasi';

                    var detailHtml = escapeHTML(response.data.layanan) || '-';
                    if (statusText.includes('tolak') && response.data.alasanTolak) {
                        detailHtml += '<br><span class="text-danger mt-2 d-block small"><b>Alasan Ditolak:</b> ' + escapeHTML(response.data.alasanTolak) + '</span>';
                    }
                    document.getElementById('detailTiket').innerHTML = detailHtml;

                    resultBox.classList.remove('d-none');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Tidak Ditemukan',
                        text: response.message || 'ID Tiket tidak ditemukan dalam sistem kami.',
                        confirmButtonColor: '#d33'
                    });
                }
            })
            .withFailureHandler(function (error) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-search me-2"></i> Cek Status';
                Swal.fire({
                    icon: 'error',
                    title: 'Terjadi Kesalahan',
                    text: 'Gagal terhubung dengan server. Silakan coba lagi.',
                    confirmButtonColor: '#d33'
                });
            })
            .cekStatusTiket(idTiket);
    }

    function prosesLogin(event) {
        event.preventDefault();

        var tipeLogin = document.getElementById('inputTipeLogin').value;
        var username = document.getElementById('inputUsername').value;
        var password = document.getElementById('inputPassword').value;
        var btn = document.getElementById('btnLogin');

        if (!username || !password) {
            Swal.fire({
                icon: 'warning',
                title: 'Perhatian',
                text: 'Harap isi Username dan Password terlebih dahulu!',
                confirmButtonColor: '#3c8dbc'
            });
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Memverifikasi...';

        // Timer pengaman jika server tidak merespon dalam 15 detik
        var loginTimeout = setTimeout(function () {
            if (btn.disabled) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i> Login';
                Swal.fire('Waktu Habis', 'Server terlalu lama merespon. Silakan muat ulang halaman (Refresh) dan coba lagi.', 'warning');
            }
        }, 15000);

        // Bypass logika untuk preview lokal
        if (typeof google === 'undefined' || !google.script) {
            clearTimeout(loginTimeout);
            setTimeout(function () {
                var roleSimulasi = 'Operator';
                var targetSimulasi = 'Index.html';

                // Set Role dan Target Sesuai Pilihan Login
                if (tipeLogin === 'admin') {
                    roleSimulasi = 'Admin';
                    targetSimulasi = 'admin.html';
                } else if (tipeLogin === 'superadmin') {
                    roleSimulasi = 'Super Admin';
                    targetSimulasi = 'admin.html';
                }

                Swal.fire({
                    icon: 'info',
                    title: 'Mode Preview',
                    text: 'Login sebagai ' + roleSimulasi + ' disimulasikan. Mengalihkan ke Dashboard...',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('userRole', roleSimulasi);
                    window.open(targetSimulasi, "_top"); // Redirect untuk preview lokal
                });
            }, 1000);
            return;
        }

        // Proses login ke server GAS (Mengirim tipeLogin juga ke backend: 'user', 'admin', 'superadmin')
        google.script.run
            .withSuccessHandler(function (response) {
                clearTimeout(loginTimeout);
                if (response.success) {
                    sessionStorage.setItem('isLoggedIn', 'true');

                    var roleInfo = (response.user.role || response.user.jabatan || tipeLogin).toLowerCase();
                    sessionStorage.setItem('userRole', roleInfo);
                    sessionStorage.setItem('authToken', response.token);

                    // Menentukan tujuan halaman berdasarkan role user
                    var targetPage = (roleInfo.includes('admin') || roleInfo.includes('super')) ? 'admin' : 'Index';

                    // Mempercepat login dengan memproses redirect secara instan tanpa pesan animasi
                    if (typeof SCRIPT_URL !== 'undefined' && SCRIPT_URL) {
                        window.open(SCRIPT_URL + "?page=" + targetPage, "_top");
                    } else {
                        google.script.run
                            .withSuccessHandler(function (url) {
                                window.open(url + "?page=" + targetPage, "_top");
                            })
                            .withFailureHandler(function (error) {
                                console.error("Gagal mendapatkan URL:", error);
                                Swal.fire('Error Redirect', 'Berhasil login tapi gagal memuat ulang halaman. Silakan muat ulang manual.', 'warning');
                            })
                            .getScriptUrl();
                    }

                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Login Gagal',
                        text: response.message,
                        confirmButtonColor: '#d33'
                    });
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i> Login';
                }
            })
            .withFailureHandler(function (error) {
                clearTimeout(loginTimeout);
                Swal.fire({
                    icon: 'error',
                    title: 'Terjadi Kesalahan',
                    text: 'Gagal terhubung dengan server. Silakan coba lagi.',
                    confirmButtonColor: '#d33'
                });
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i> Login';
            })
            // Pastikan fungsi verifyLogin(username, password, tipeLogin) Anda 
            // dikonfigurasi untuk mengecek ketiga role ini secara terpisah.
            .verifyLogin(username, password, tipeLogin);
    }
