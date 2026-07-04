// JS.html - Volunteer OS Client Logic

// ==========================================
// APPLICATION STATE
// ==========================================
const state = {
  user: null,
  currentPage: 'Home',
  items: [],
  activities: [],
  quizzes: [],
  questions: [],
  currentQuizAnswers: {},
  activeQuizId: null,
  activeQuizTakerId: null,
  dashboardStats: null
};

// ==========================================
// INIT APP ON LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  navigateTo('Home');
});

function initUI() {
  // Bind Header Links
  document.getElementById('nav-home').addEventListener('click', () => navigateTo('Home'));
  document.getElementById('nav-contact').addEventListener('click', () => navigateTo('Contact'));
  document.getElementById('nav-login-btn').addEventListener('click', () => navigateTo('Login'));
  document.getElementById('nav-logout').addEventListener('click', handleLogout);
  
  // Login Page Elements
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('btn-open-register').addEventListener('click', () => openModal('register-modal'));
  
  // Registration Form
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  
  // Profile Editor Form
  document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
  
  // Daily Goodness
  document.getElementById('goodness-form').addEventListener('submit', handleGoodnessSubmit);
  
  // Comments
  document.getElementById('comment-form').addEventListener('submit', handleCommentSubmit);
  
  // QR Scanner Simulator Closer
  document.getElementById('btn-close-scanner').addEventListener('click', () => closeModal('scanner-modal'));
  
  // Bind date mask to birthday text inputs
  ['reg-birthday', 'prof-birthday', 'staff-prof-birthday', 'admin-prof-birthday', 'crud-birthday'].forEach(id => {
    const el = document.getElementById(id);
    if (el) applyDateMask(el);
  });
}

// ==========================================
// ROUTER & NAVIGATION
// ==========================================
function navigateTo(page) {
  state.currentPage = page;
  
  // Update nav link active classes
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  if (page === 'Home') document.getElementById('nav-home').classList.add('active');
  if (page === 'Contact') document.getElementById('nav-contact').classList.add('active');
  if (page === 'Login') document.getElementById('nav-login-btn').classList.add('active');
  
  // Hide all sections
  document.getElementById('home-section').classList.add('hidden');
  document.getElementById('contact-section').classList.add('hidden');
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.add('hidden');
  
  // Render Target Page
  if (page === 'Home') {
    document.getElementById('home-section').classList.remove('hidden');
    loadHomePage();
  } else if (page === 'Contact') {
    document.getElementById('contact-section').classList.remove('hidden');
    loadContactPage();
  } else if (page === 'Login') {
    if (state.user) {
      // If already logged in, navigate to Role Dashboard instead
      navigateTo('Dashboard');
    } else {
      document.getElementById('login-section').classList.remove('hidden');
    }
  } else if (page === 'Dashboard') {
    if (!state.user) {
      navigateTo('Login');
    } else {
      document.getElementById('dashboard-section').classList.remove('hidden');
      loadRoleDashboard();
    }
  }
}

// ==========================================
// VIEW RENDERING: HOME
// ==========================================
function loadHomePage() {
  const container = document.getElementById('home-grid');
  container.innerHTML = '<div class="grid-item full text-center"><p class="text-secondary">กำลังโหลดข้อมูล...</p></div>';

  callBackend('getItems', ['Home'])
    .then(items => {
      state.items = items;
      renderItemsGrid(items, container);

      // Load public department statistics
      loadDepartmentStats();
    })
    .catch(err => {
      showToast('ไม่สามารถโหลดข้อมูลหน้าแรกได้: ' + err.message, 'error');
    });
}

function renderItemsGrid(items, container) {
  container.innerHTML = '';
  if (items.length === 0) {
    container.innerHTML = '<div class="grid-item full text-center"><p class="text-secondary">ไม่มีข้อมูลจะแสดง</p></div>';
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');

    // Class names map sizes & hero layouts
    let sizeClass = 'w1x1';
    if (item.Size === 'full') sizeClass = 'full';
    else if (item.Size === '2x2') sizeClass = 'w2x2';
    else if (item.Size === '2x1') sizeClass = 'w2x1';

    card.className = `grid-item ${sizeClass}`;

    if (item.Type === 'hero-banner' || item.Type === 'hero') {
      card.className += ' hero-banner';
    }

    let iconHtml = '';
    if (item.IconURL && item.IconURL.trim() !== '') {
      iconHtml = `<img src="${item.IconURL}" alt="${item.Title}" />`;
    }

    let linkHtml = '';
    if (item.LinkURL && item.LinkURL.trim() !== '') {
      linkHtml = `<a href="${item.LinkURL}" class="btn ${item.Type === 'hero-banner' ? 'btn-primary' : 'btn-secondary'} mt-4">เพิ่มเติม</a>`;
    }

    card.innerHTML = `
      <div>
        ${iconHtml}
        <h3>${item.Title}</h3>
        <p>${item.Subtitle || ''}</p>
      </div>
      <div>
        ${linkHtml}
      </div>
    `;
    container.appendChild(card);
  });
}

function loadDepartmentStats() {
  const chartContainer = document.getElementById('home-dept-chart');
  chartContainer.innerHTML = '<p class="text-secondary text-center">กำลังโหลดข้อมูลสถิติ...</p>';

  callBackend('getDashboardStats', ['Guest', null, null])
    .then(stats => {
      chartContainer.innerHTML = '';
      if (!stats.deptStats || stats.deptStats.length === 0) {
        chartContainer.innerHTML = '<p class="text-secondary text-center">ยังไม่มีข้อมูลสมาชิกแยกตามแผนก</p>';
        return;
      }

      // Calculate max count for sizing bars
      const maxCount = Math.max(...stats.deptStats.map(d => d.count));

      stats.deptStats.forEach(d => {
        const pct = (d.count / maxCount) * 100;
        const row = document.createElement('div');
        row.className = 'mb-4';
        row.innerHTML = `
          <div class="d-flex justify-between align-center mb-4" style="font-size:12px;">
            <span class="text-bold">${d.department}</span>
            <span class="text-secondary">${d.count} คน</span>
          </div>
          <div style="background-color:var(--bg-secondary); border-radius:4px; height:8px; width:100%; overflow:hidden;">
            <div style="background-color:var(--accent-blue); height:100%; width:${pct}%; border-radius:4px; transition: width 0.8s ease;"></div>
          </div>
        `;
        chartContainer.appendChild(row);
      });
    })
    .catch(err => {
      chartContainer.innerHTML = '<p class="text-danger text-center">โหลดสถิติไม่สำเร็จ</p>';
    });
}

// ==========================================
// VIEW RENDERING: CONTACT
// ==========================================
function loadContactPage() {
  const container = document.getElementById('contact-grid');
  container.innerHTML = '<div class="grid-item full text-center"><p class="text-secondary">กำลังโหลดข้อมูล...</p></div>';

  callBackend('getItems', ['Contact'])
    .then(items => {
      renderItemsGrid(items, container);
    })
    .catch(err => {
      showToast('ไม่สามารถโหลดข้อมูลหน้าติดต่อเราได้: ' + err.message, 'error');
    });
}

// ==========================================
// AUTHENTICATION: LOGIN & REGISTRATION
// ==========================================
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value.trim();

  if (!email || !pass) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    return;
  }

  const submitBtn = document.getElementById('login-submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'กำลังลงชื่อเข้าใช้...';

  callBackend('login', [email, pass])
    .then(user => {
      state.user = user;

      // Update Navbar layout
      document.getElementById('nav-login-btn').classList.add('hidden');
      document.getElementById('nav-logout').classList.remove('hidden');
      document.getElementById('nav-user-profile').classList.remove('hidden');
      document.getElementById('user-profile-name').innerText = `${user.PreName}${user.Name}`;

      if (user.Photo && user.Photo.trim() !== '') {
        document.getElementById('user-profile-img').src = user.Photo;
        document.getElementById('user-profile-img').classList.remove('hidden');
      } else {
        document.getElementById('user-profile-img').classList.add('hidden');
      }

      showToast(`ยินดีต้อนรับคุณ ${user.Name}!`, 'success');

      // Clear login inputs
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'ลงชื่อเข้าใช้';

      // Navigate to Dashboard
      navigateTo('Dashboard');
    })
    .catch(err => {
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'ลงชื่อเข้าใช้';
    });
}

function handleLogout() {
  state.user = null;

  // Update Navbar UI
  document.getElementById('nav-login-btn').classList.remove('hidden');
  document.getElementById('nav-logout').classList.add('hidden');
  document.getElementById('nav-user-profile').classList.add('hidden');

  showToast('ออกจากระบบเรียบร้อยแล้ว', 'success');
  navigateTo('Home');
}

async function handleRegister(e) {
  e.preventDefault();

  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-password').value.trim();
  const preName = document.getElementById('reg-prename').value;
  const name = document.getElementById('reg-name').value.trim();
  const lastName = document.getElementById('reg-lastname').value.trim();
  const nickName = document.getElementById('reg-nickname').value.trim();
  const birthday = document.getElementById('reg-birthday').value;
  const department = document.getElementById('reg-department').value;
  const photoFile = document.getElementById('reg-photo').files[0];

  if (!email || !pass || !preName || !name || !lastName) {
    showToast('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน', 'error');
    return;
  }

  const submitBtn = document.getElementById('reg-submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'กำลังลงทะเบียน...';

  try {
    let photoUrl = '';
    if (photoFile) {
      const base64 = await toBase64(photoFile);
      photoUrl = await uploadFileToServer(base64, `profile_${email}_${photoFile.name}`);
    }

    const regData = {
      UserID: email,
      Password: pass,
      PreName: preName,
      Name: name,
      LastName: lastName,
      NickName: nickName,
      Photo: photoUrl,
      Birthday: birthday,
      Level: 'New',
      Department: department,
      Role: 'User'
    };

    callBackend('registerUser', [regData])
    .then(res => {
        showToast('ลงทะเบียนสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ', 'success');
        closeModal('register-modal');
        document.getElementById('register-form').reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'ลงทะเบียน';
      })
    .catch(err => {
        showToast('ลงทะเบียนไม่สำเร็จ: ' + err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'ลงทะเบียน';
      });

  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'ลงทะเบียน';
  }
}

// ==========================================
// ROLE BASED DASHBOARD MANAGER
// ==========================================
function loadRoleDashboard() {
  const role = state.user.Role;

  // Hide all dashboard panels first
  document.getElementById('user-dashboard-panel').classList.add('hidden');
  document.getElementById('staff-dashboard-panel').classList.add('hidden');
  document.getElementById('admin-dashboard-panel').classList.add('hidden');

  // Show target panel
  if (role === 'User') {
    document.getElementById('user-dashboard-panel').classList.remove('hidden');
    loadUserRoleDashboard();
  } else if (role === 'Staff') {
    document.getElementById('staff-dashboard-panel').classList.remove('hidden');
    loadStaffRoleDashboard();
  } else if (role === 'Admin') {
    document.getElementById('admin-dashboard-panel').classList.remove('hidden');
    loadAdminRoleDashboard();
  }
}

// ==========================================
// USER DASHBOARD FLOWS
// ==========================================
function loadUserRoleDashboard() {
  document.getElementById('user-dash-title').innerText = `ห้องทำงานของ ${state.user.PreName}${state.user.Name}`;

  // Render profile preview
  renderProfileData();

  // Load User Stats & History
  callBackend('getDashboardStats', ['User', state.user.UserID, null])
    .then(stats => {
      state.dashboardStats = stats;

      // Update BoonPoints Circle Ring
      const pts = stats.user.totalBoonPoints || 0;
      document.getElementById('user-boonpoint-value').innerText = pts;
      const ringBar = document.getElementById('boonpoint-ring-bar');

      // visual mapping (let's assume 1000 pts is full ring)
      const offsetMax = 251.2;
      const percent = Math.min(pts / 1000, 1);
      ringBar.style.strokeDashoffset = offsetMax - (offsetMax * percent);

      // Render breakdown points
      document.getElementById('val-act-pts').innerText = stats.user.activityPoints + ' แต้ม';
      document.getElementById('val-quiz-pts').innerText = stats.user.quizPoints + ' แต้ม';
      document.getElementById('val-good-pts').innerText = stats.user.goodnessPoints + ' แต้ม';

      // Render Activity History Table
      const actTable = document.getElementById('user-activity-table-body');
      actTable.innerHTML = '';
      if (stats.user.activityHistory.length === 0) {
        actTable.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">ยังไม่มีข้อมูลการร่วมกิจกรรม</td></tr>';
      } else {
        stats.user.activityHistory.forEach(a => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${a.AcId}</td>
            <td>${a.title}</td>
            <td>${formatDateString(a.Timestamp)}</td>
            <td class="text-bold text-success">+${a.BoonScore}</td>
          `;
          actTable.appendChild(row);
        });
      }

      // Render Quiz History Table
      const quizTable = document.getElementById('user-quiz-table-body');
      quizTable.innerHTML = '';
      if (stats.user.quizHistory.length === 0) {
        quizTable.innerHTML = '<tr><td colspan="5" class="text-center text-secondary">ยังไม่มีประวัติการทำข้อสอบ</td></tr>';
      } else {
        stats.user.quizHistory.forEach(q => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${q.QuizsetId}</td>
            <td>${q.title}</td>
            <td>${formatDateString(q.Timestamp)}</td>
            <td class="text-center">${q.BoonScore} / ${q.MaxScore}</td>
            <td class="text-bold text-success">+${q.BoonScore}</td>
          `;
          quizTable.appendChild(row);
        });
      }

      // Render Goodness logs
      const goodnessTable = document.getElementById('user-goodness-table-body');
      goodnessTable.innerHTML = '';
      if (stats.user.goodnessLogs.length === 0) {
        goodnessTable.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">ยังไม่มีการบันทึกความดีสากล</td></tr>';
      } else {
        stats.user.goodnessLogs.forEach(g => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${formatDateOnly(g.DoDate)}</td>
            <td>
              <span class="badge" style="background-color:rgba(0,113,227,0.05); color:var(--text-primary);">
                ทาน: ${g.GivingPoint} | ศีล: ${g.SilaPoint} | สะอาด: ${g.CleanPoint} | ระเบียบ: ${g.ArrayPoint} | สุภาพ: ${g.PolitePoint} | ตรงเวลา: ${g.OntimePoint} | สมาธิ: ${g.MeditatePoint}
              </span>
            </td>
            <td class="text-center">${g.sumPoint} / 7</td>
            <td class="text-bold text-success">+${g.sumPoint}</td>
          `;
          goodnessTable.appendChild(row);
        });
      }

      // Populate active activity list for comments
      loadActivityOptionsForComment();
    })
    .catch(err => {
      showToast('ไม่สามารถโหลดข้อมูลสถิติผู้ใช้งานได้: ' + err.message, 'error');
    });
}

function renderProfileData() {
  document.getElementById('prof-avatar').src = state.user.Photo && state.user.Photo !== '' ? state.user.Photo : 'https://img.icons8.com/ios-glyphs/90/cccccc/user-female-circle.png';
  document.getElementById('prof-prename').value = state.user.PreName;
  document.getElementById('prof-name').value = state.user.Name;
  document.getElementById('prof-lastname').value = state.user.LastName;
  document.getElementById('prof-nickname').value = state.user.NickName || '';
  document.getElementById('prof-birthday').value = formatBirthdayForInput(state.user.Birthday);
  document.getElementById('prof-department').value = state.user.Department || '';
  document.getElementById('prof-level').value = state.user.Level || 'New';
  document.getElementById('prof-role').value = state.user.Role || 'User';
}

function toggleProfileEdit(editable) {
  const fields = ['prof-prename', 'prof-name', 'prof-lastname', 'prof-nickname', 'prof-birthday', 'prof-department', 'prof-photo'];
  fields.forEach(id => {
    document.getElementById(id).disabled = !editable;
  });

  if (editable) {
    document.getElementById('prof-edit-actions').classList.remove('hidden');
    document.getElementById('btn-start-prof-edit').classList.add('hidden');
  } else {
    document.getElementById('prof-edit-actions').classList.add('hidden');
    document.getElementById('btn-start-prof-edit').classList.remove('hidden');
    document.getElementById('prof-photo').value = '';
    renderProfileData(); // Reset inputs
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('btn-save-profile');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'กำลังบันทึก...';

  const photoFile = document.getElementById('prof-photo').files[0];
  let photoUrl = state.user.Photo || '';

  try {
    if (photoFile) {
      const base64 = await toBase64(photoFile);
      photoUrl = await uploadFileToServer(base64, `profile_${state.user.UserID}_${photoFile.name}`);
    }

    const updatedUser = {
      ...state.user,
      PreName: document.getElementById('prof-prename').value,
      Name: document.getElementById('prof-name').value.trim(),
      LastName: document.getElementById('prof-lastname').value.trim(),
      NickName: document.getElementById('prof-nickname').value.trim(),
      Birthday: document.getElementById('prof-birthday').value,
      Department: document.getElementById('prof-department').value,
      Photo: photoUrl
    };

    callBackend('updateUserProfile', [updatedUser, state.user.Role])
    .then(res => {
        state.user = updatedUser;
        showToast('ปรับปรุงข้อมูลส่วนตัวสำเร็จ!', 'success');
        document.getElementById('prof-photo').value = '';
        toggleProfileEdit(false);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'บันทึก';

        // Update navbar profile display
        document.getElementById('user-profile-name').innerText = `${updatedUser.PreName}${updatedUser.Name}`;
        if (updatedUser.Photo && updatedUser.Photo !== '') {
          document.getElementById('user-profile-img').src = updatedUser.Photo;
          document.getElementById('user-profile-img').classList.remove('hidden');
        }
      })
    .catch(err => {
        showToast('ปรับปรุงโปรไฟล์ล้มเหลว: ' + err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'บันทึก';
      });

  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'บันทึก';
  }
}

// Daily Goodness File Preview bindings
function handleFileChange(input, previewId) {
  const file = input.files[0];
  const preview = document.getElementById(previewId);
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      if (preview.tagName === 'IMG') {
        preview.src = e.target.result;
      } else {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
      }
    };
    reader.readAsDataURL(file);
  } else {
    if (preview.tagName === 'IMG') {
      preview.src = 'https://img.icons8.com/ios-glyphs/90/cccccc/user-female-circle.png';
    } else {
      preview.innerHTML = 'ไม่มีไฟล์ภาพ';
    }
  }
}

async function handleGoodnessSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('goodness-submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'กำลังส่งความดี...';

  const doDate = document.getElementById('good-date').value;
  if (!doDate) {
    showToast('กรุณาระบุวันที่ที่ลงมือทำความดี', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'บันทึกความดีสากลประจำวัน';
    return;
  }

  if (state.dashboardStats && state.dashboardStats.user && state.dashboardStats.user.goodnessLogs) {
    const targetIdScore = String(state.user.UserID).toLowerCase().trim() + '_' + doDate;
    const dateExists = state.dashboardStats.user.goodnessLogs.some(g => {
      if (!g.IDScore) return false;
      return String(g.IDScore).toLowerCase().trim() === targetIdScore;
    });
    if (dateExists) {
      showToast(`คุณได้บันทึกการทำความดีของวันที่ ${doDate} ไปแล้วในระบบ (ส่งได้วันละ 1 ครั้งเท่านั้น)`, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'บันทึกความดีสากลประจำวัน';
      return;
    }
  }

  try {
    // 1. Process Photos to drive (parallelly if possible)
    let givingUrl = '';
    let cleanUrl = '';
    let arrayUrl = '';
    let meditateUrl = '';

    const fileGiving = document.getElementById('good-giving-photo').files[0];
    const fileClean = document.getElementById('good-clean-photo').files[0];
    const fileArray = document.getElementById('good-array-photo').files[0];
    const fileMeditate = document.getElementById('good-meditate-photo').files[0];

    if (fileGiving) {
      const b64 = await toBase64(fileGiving);
      givingUrl = await uploadFileToServer(b64, `good_giving_${state.user.UserID}_${fileGiving.name}`);
    }
    if (fileClean) {
      const b64 = await toBase64(fileClean);
      cleanUrl = await uploadFileToServer(b64, `good_clean_${state.user.UserID}_${fileClean.name}`);
    }
    if (fileArray) {
      const b64 = await toBase64(fileArray);
      arrayUrl = await uploadFileToServer(b64, `good_array_${state.user.UserID}_${fileArray.name}`);
    }
    if (fileMeditate) {
      const b64 = await toBase64(fileMeditate);
      meditateUrl = await uploadFileToServer(b64, `good_meditate_${state.user.UserID}_${fileMeditate.name}`);
    }

    const goodnessData = {
      DoDate: doDate,
      UserID: state.user.UserID,
      GivingPhoto: givingUrl,
      SilaText: document.getElementById('good-sila-text').value.trim(),
      CleanPhoto: cleanUrl,
      ArrayPhoto: arrayUrl,
      PoliteText: document.getElementById('good-polite-text').value.trim(),
      OntimeText: document.getElementById('good-ontime-text').value.trim(),
      MeditatePhoto: meditateUrl
    };

    callBackend('saveGoodness', [goodnessData])
    .then(res => {
        showToast(`บันทึกความดีสำเร็จ! ได้รับคะแนนบุญสะสม +${res.pointsEarned} แต้ม`, 'success');
        document.getElementById('goodness-form').reset();

        // Reset preview cards
        ['preview-giving', 'preview-clean', 'preview-array', 'preview-meditate'].forEach(id => {
          document.getElementById(id).innerHTML = 'ไม่มีไฟล์ภาพ';
        });

        // Reload dashboard to update score
        loadUserRoleDashboard();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'บันทึกความดีสากลประจำวัน';
      })
    .catch(err => {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'บันทึกความดีสากลประจำวัน';
      });

  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการจัดเก็บรูปภาพ: ' + err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'บันทึกความดีสากลประจำวัน';
  }
}

function loadActivityOptionsForComment() {
  const select = document.getElementById('comment-act-id');
  select.innerHTML = '<option value="">เลือกกิจกรรมที่เคยเข้าร่วม</option>';

  if (state.dashboardStats && state.dashboardStats.user.activityHistory) {
    state.dashboardStats.user.activityHistory.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.AcId;
      opt.text = `[${a.AcId}] ${a.title}`;
      select.appendChild(opt);
    });
  }
}

function handleCommentSubmit(e) {
  e.preventDefault();

  const acId = document.getElementById('comment-act-id').value;
  const commentText = document.getElementById('comment-text').value.trim();

  if (!acId || !commentText) {
    showToast('กรุณากรอกข้อมูลการแสดงความประทับใจให้ครบถ้วน', 'error');
    return;
  }

  const btn = document.getElementById('comment-submit-btn');
  btn.disabled = true;
  btn.innerHTML = 'กำลังบันทึกคอมเมนต์...';

  callBackend('submitActivityComment', [state.user.UserID, acId, commentText])
    .then(res => {
      showToast('บันทึกคำชื่นชม/ความประทับใจสำเร็จแล้ว!', 'success');
      document.getElementById('comment-form').reset();
      btn.disabled = false;
      btn.innerHTML = 'ส่งความคิดเห็น';
    })
    .catch(err => {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = 'ส่งความคิดเห็น';
    });
}

// ==========================================
// STAFF DASHBOARD FLOWS
// ==========================================
function loadStaffRoleDashboard() {
  document.getElementById('staff-dash-title').innerText = `ห้องทำงานเจ้าหน้าที่ แผนก ${state.user.Department}`;

  // Staff Profile Preview
  renderStaffProfileData();

  // Load Member List and stats
  callBackend('getDashboardStats', ['Staff', state.user.UserID, state.user.Department])
    .then(stats => {
      state.dashboardStats = stats;
      renderStaffMembersTable(stats.staff.departmentUsers);

      // Load active activities list inside activity attendance register
      loadAttendanceActivityOptions();

      // Load Quiz selection inside quiz manager panel
      loadQuizOptions();
    })
    .catch(err => {
      showToast('ไม่สามารถโหลดข้อมูลสมาชิกร่วมแผนกได้: ' + err.message, 'error');
    });
}

function renderStaffProfileData() {
  document.getElementById('staff-prof-avatar').src = state.user.Photo && state.user.Photo !== '' ? state.user.Photo : 'https://img.icons8.com/ios-glyphs/90/cccccc/user-female-circle.png';
  document.getElementById('staff-prof-prename').value = state.user.PreName;
  document.getElementById('staff-prof-name').value = state.user.Name;
  document.getElementById('staff-prof-lastname').value = state.user.LastName;
  document.getElementById('staff-prof-nickname').value = state.user.NickName || '';
  document.getElementById('staff-prof-birthday').value = formatBirthdayForInput(state.user.Birthday);
  document.getElementById('staff-prof-department').value = state.user.Department || '';
}

function toggleStaffProfileEdit(editable) {
  const fields = ['staff-prof-prename', 'staff-prof-name', 'staff-prof-lastname', 'staff-prof-nickname', 'staff-prof-birthday', 'staff-prof-photo'];
  fields.forEach(id => {
    document.getElementById(id).disabled = !editable;
  });

  if (editable) {
    document.getElementById('staff-prof-edit-actions').classList.remove('hidden');
    document.getElementById('btn-start-staff-prof-edit').classList.add('hidden');
  } else {
    document.getElementById('staff-prof-edit-actions').classList.add('hidden');
    document.getElementById('btn-start-staff-prof-edit').classList.remove('hidden');
    document.getElementById('staff-prof-photo').value = '';
    renderStaffProfileData();
  }
}

async function handleStaffProfileUpdate(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('btn-save-staff-profile');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'กำลังบันทึก...';

  const photoFile = document.getElementById('staff-prof-photo').files[0];
  let photoUrl = state.user.Photo || '';

  try {
    if (photoFile) {
      const base64 = await toBase64(photoFile);
      photoUrl = await uploadFileToServer(base64, `profile_${state.user.UserID}_${photoFile.name}`);
    }

    const updatedUser = {
      ...state.user,
      PreName: document.getElementById('staff-prof-prename').value,
      Name: document.getElementById('staff-prof-name').value.trim(),
      LastName: document.getElementById('staff-prof-lastname').value.trim(),
      NickName: document.getElementById('staff-prof-nickname').value.trim(),
      Birthday: document.getElementById('staff-prof-birthday').value,
      Photo: photoUrl
    };

    callBackend('updateUserProfile', [updatedUser, state.user.Role])
    .then(res => {
        state.user = updatedUser;
        showToast('ปรับปรุงข้อมูลส่วนตัวสำเร็จ!', 'success');
        document.getElementById('staff-prof-photo').value = '';
        toggleStaffProfileEdit(false);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'บันทึก';

        document.getElementById('user-profile-name').innerText = `${updatedUser.PreName}${updatedUser.Name}`;
        if (updatedUser.Photo && updatedUser.Photo !== '') {
          document.getElementById('user-profile-img').src = updatedUser.Photo;
          document.getElementById('user-profile-img').classList.remove('hidden');
        }
      })
    .catch(err => {
        showToast('ปรับปรุงล้มเหลว: ' + err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'บันทึก';
      });

  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'บันทึก';
  }
}

function renderStaffMembersTable(usersList) {
  const tbody = document.getElementById('staff-members-table-body');
  tbody.innerHTML = '';
  if (usersList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">ไม่มีข้อมูลสมาชิกในแผนกนี้</td></tr>';
    return;
  }

  usersList.forEach(u => {
    const row = document.createElement('tr');

    let photoHtml = '<img src="https://img.icons8.com/ios-glyphs/30/cccccc/user-female-circle.png" class="avatar-thumb" />';
    if (u.Photo && u.Photo.trim() !== '') {
      photoHtml = `<img src="${u.Photo}" class="avatar-thumb" />`;
    }

    row.innerHTML = `
      <td class="text-center">${photoHtml}</td>
      <td>${u.UserID}</td>
      <td><a href="#" style="color: var(--accent-blue); text-decoration: underline; font-weight: 500;" onclick="viewMemberHistory('${u.UserID}'); return false;">${u.PreName}${u.Name} ${u.LastName}</a></td>
      <td>${u.NickName || '-'}</td>
      <td><span class="badge badge-user">${u.Level}</span></td>
      <td>
        <button class="btn btn-secondary btn-small" onclick="openEditUserModal('${u.UserID}')">แก้ไข</button>
        <button class="btn btn-danger btn-small" onclick="handleDeleteUser('${u.UserID}')">ลบ</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function loadAttendanceActivityOptions() {
  const staffSelect = document.getElementById('staff-attend-act-id');
  const adminSelect = document.getElementById('admin-attend-act-id');
  const staffVal = staffSelect ? staffSelect.value : '';
  const adminVal = adminSelect ? adminSelect.value : '';

  callBackend('registerActivityParticipation', [userId, acId, comment])
    .then(activities => {
      state.activities = activities;

      const elements = [
        { el: staffSelect, val: staffVal },
        { el: adminSelect, val: adminVal }
      ];

      elements.forEach(item => {
        if (!item.el) return;
        item.el.innerHTML = '<option value="">เลือกกิจกรรมอาสา</option>';
        activities.forEach(a => {
          if (a.Status === 'Active') {
            const opt = document.createElement('option');
            opt.value = a.AcID;
            opt.text = `[${a.AcID}] ${a.Title}`;
            item.el.appendChild(opt);
          }
        });
        if (item.val) {
          item.el.value = item.val;
        }
      });
    })
    .getActivitySets();
}

function loadQuizOptions() {
  const staffSelect = document.getElementById('staff-quiz-id');
  const adminSelect = document.getElementById('admin-quiz-id');
  const staffVal = staffSelect ? staffSelect.value : '';
  const adminVal = adminSelect ? adminSelect.value : '';

  callBackend('getQuizSets', [])
    .then(quizzes => {
      state.quizzes = quizzes;

      const elements = [
        { el: staffSelect, val: staffVal },
        { el: adminSelect, val: adminVal }
      ];

      elements.forEach(item => {
        if (!item.el) return;
        item.el.innerHTML = '<option value="">เลือกชุดข้อสอบธรรมะ</option>';
        quizzes.forEach(q => {
          if (q.Status === 'Active') {
            const opt = document.createElement('option');
            opt.value = q.QuizsetID;
            opt.text = `[${q.QuizsetID}] ${q.Title}`;
            item.el.appendChild(opt);
          }
        });
        if (item.val) {
          item.el.value = item.val;
        }
      });
    });
}

// QR Scanner Simulator Trigger
function startQRScanner(targetInputId) {
  openModal('scanner-modal');

  // Populate simulator select options to simulate scanning an existing user
  const scannerSelect = document.getElementById('scanner-user-select');
  scannerSelect.innerHTML = '<option value="">-- สมมติเลือกผู้ใช้งานที่สแกน --</option>';

  callBackend('getAllUsers', [])
    .then(users => {
      users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.UserID;
        opt.text = `${u.PreName}${u.Name} (${u.UserID})`;
        scannerSelect.appendChild(opt);
      });

      // Bind select change to close modal and insert scan result
      scannerSelect.onchange = function() {
        if (this.value !== '') {
          document.getElementById(targetInputId).value = this.value;
          closeModal('scanner-modal');
          showToast(`สแกน QR Code สำเร็จ: ${this.value}`, 'success');
        }
      };

      // Text keyboard input simulation
      const submitBtn = document.getElementById('btn-scanner-submit-manual');
      submitBtn.onclick = function() {
        const manualInput = document.getElementById('scanner-manual-input').value.trim();
        if (manualInput !== '') {
          document.getElementById(targetInputId).value = manualInput;
          closeModal('scanner-modal');
          showToast(`กรอกรหัสสมาชิก: ${manualInput}`, 'success');
        } else {
          showToast('กรุณากรอกรหัสสมาชิก', 'error');
        }
      };
    });
}

// Attendance submissions (Staff or Admin workflow)
function submitActivityAttendance(rolePrefix) {
  const acId = document.getElementById(`${rolePrefix}-attend-act-id`).value;
  const userId = document.getElementById(`${rolePrefix}-attend-userid`).value.trim();
  const comment = document.getElementById(`${rolePrefix}-attend-comment`).value.trim();

  if (!acId || !userId) {
    showToast('กรุณาเลือกกิจกรรมและสแกนหรือระบุ UserID (Email)', 'error');
    return;
  }

  const btn = document.getElementById(`${rolePrefix}-attend-submit-btn`);
  btn.disabled = true;
  btn.innerHTML = 'กำลังลงทะเบียน...';

  callBackend('catch', [err => {
      showToast(err.message, 'error'])
    .then(res => {
      showToast(`ลงทะเบียนผู้ร่วมกิจกรรมสำเร็จ! มอบคะแนนบุญสะสม +${res.scoreEarned} แต้ม ให้กับ ${userId} แล้ว`, 'success');
      document.getElementById(`${rolePrefix}-attend-userid`).value = '';
      document.getElementById(`${rolePrefix}-attend-comment`).value = '';
      btn.disabled = false;
      btn.innerHTML = 'บันทึกการร่วมกิจกรรม';

      // Reload stats/activities
      if (state.user.Role === 'Staff') loadStaffRoleDashboard();
      if (state.user.Role === 'Admin') loadAdminRoleDashboard();
    });
      btn.disabled = false;
      btn.innerHTML = 'บันทึกการร่วมกิจกรรม';
    });
}

// ==========================================
// QUIZ FLOWS (STAFF & ADMIN WORKFLOW)
// ==========================================
function startQuizWorkflow(rolePrefix) {
  const quizId = document.getElementById(`${rolePrefix}-quiz-id`).value;
  const userId = document.getElementById(`${rolePrefix}-quiz-userid`).value.trim();

  if (!quizId || !userId) {
    showToast('กรุณาเลือกชุดข้อสอบธรรมะ และระบุหรือสแกนรหัสสมาชิก', 'error');
    return;
  }

  // Set current quiz target
  state.activeQuizId = quizId;
  state.activeQuizTakerId = userId;

  const startBtn = document.getElementById(`${rolePrefix}-quiz-start-btn`);
  startBtn.disabled = true;
  startBtn.innerHTML = 'กำลังตรวจสอบสิทธิ์...';

  callBackend('getQuestionsForUser', [userId, quizId])
    .then(questions => {
      state.questions = questions;
      state.currentQuizAnswers = {};

      if (questions.length === 0) {
        showToast('ชุดข้อสอบนี้ยังไม่มีคำถามกรอกไว้ในระบบ', 'error');
        startBtn.disabled = false;
        startBtn.innerHTML = 'เริ่มทำข้อสอบ';
        return;
      }

      // Display the Quiz Frame inside modal
      openModal('quiz-execution-modal');
      renderQuizQuestion(0);

      startBtn.disabled = false;
      startBtn.innerHTML = 'เริ่มทำข้อสอบ';
    })
    .catch(err => {
      showToast(err.message, 'error');
      startBtn.disabled = false;
      startBtn.innerHTML = 'เริ่มทำข้อสอบ';
    });
}

function renderQuizQuestion(index) {
  const qContainer = document.getElementById('quiz-questions-wrapper');
  qContainer.innerHTML = '';

  const q = state.questions[index];
  const total = state.questions.length;

  const qCard = document.createElement('div');
  qCard.innerHTML = `
    <div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">คำถามข้อที่ ${index + 1} จากทั้งหมด ${total} ข้อ</div>
    <h3 class="mb-4">${q.QuestionText}</h3>

    <button class="quiz-choice-btn ${state.currentQuizAnswers[q.QuestionID] === q.Choice1 ? 'selected' : ''}" onclick="selectQuizChoice('${q.QuestionID}', '${q.Choice1.replace(/'/g, "\\'")}', ${index})">ก. ${q.Choice1}</button>
    <button class="quiz-choice-btn ${state.currentQuizAnswers[q.QuestionID] === q.Choice2 ? 'selected' : ''}" onclick="selectQuizChoice('${q.QuestionID}', '${q.Choice2.replace(/'/g, "\\'")}', ${index})">ข. ${q.Choice2}</button>
    <button class="quiz-choice-btn ${state.currentQuizAnswers[q.QuestionID] === q.Choice3 ? 'selected' : ''}" onclick="selectQuizChoice('${q.QuestionID}', '${q.Choice3.replace(/'/g, "\\'")}', ${index})">ค. ${q.Choice3}</button>
    <button class="quiz-choice-btn ${state.currentQuizAnswers[q.QuestionID] === q.Choice4 ? 'selected' : ''}" onclick="selectQuizChoice('${q.QuestionID}', '${q.Choice4.replace(/'/g, "\\'")}', ${index})">ง. ${q.Choice4}</button>

    <div class="d-flex justify-between mt-4">
      <button class="btn btn-outline" ${index === 0 ? 'disabled' : ''} onclick="renderQuizQuestion(${index - 1})">ก่อนหน้า</button>
      ${index === total - 1
        ? `<button class="btn btn-primary" onclick="submitQuizAnswers()">ส่งข้อสอบ</button>`
        : `<button class="btn btn-primary" onclick="renderQuizQuestion(${index + 1})">ถัดไป</button>`
      }
    </div>
  `;
  qContainer.appendChild(qCard);
}

function selectQuizChoice(qId, choiceText, activeIdx) {
  state.currentQuizAnswers[qId] = choiceText;
  renderQuizQuestion(activeIdx);
}

function submitQuizAnswers() {
  // Check if all questions are answered
  const unanswered = state.questions.filter(q => !state.currentQuizAnswers[q.QuestionID]);
  if (unanswered.length > 0) {
    if (!confirm(`มีข้อสอบที่ยังไม่ตอบอีก ${unanswered.length} ข้อ คุณต้องการส่งกระดาษคำตอบเลยใช่หรือไม่?`)) {
      return;
    }
  }

  // Grade Quiz
  let score = 0;
  const detailedAnswers = [];

  state.questions.forEach(q => {
    const userChoice = state.currentQuizAnswers[q.QuestionID] || 'ไม่ได้ตอบ';
    const isCorrect = String(userChoice).trim() === String(q.CorectAnswer).trim(); // Spelled CorectAnswer based on database sheet header

    if (isCorrect) score++;
    detailedAnswers.push({
      questionID: q.QuestionID,
      questionText: q.QuestionText,
      selectedChoice: userChoice,
      correctChoice: q.CorectAnswer,
      isCorrect: isCorrect
    });
  });

  const boonPointsEarned = score * 10; // Let's award 10 BoonPoints per correct answer

  const pData = {
    UserID: state.activeQuizTakerId,
    QuizsetId: state.activeQuizId,
    BoonScore: boonPointsEarned,
    MaxScore: state.questions.length * 10,
    Duration: '0', // Optional duration tracker
    DetailedAnswers: JSON.stringify(detailedAnswers)
  };

  callBackend('submitQuiz', [pData])
    .then(res => {
      closeModal('quiz-execution-modal');
      alert(`ทำข้อสอบธรรมะเสร็จสิ้น!\nสมาชิก: ${state.activeQuizTakerId}\nคะแนนที่ได้: ${score} / ${state.questions.length} ข้อ\nบันทึกคะแนนบุญสะสม +${boonPointsEarned} แต้ม สำเร็จ`);

      // Reset variables
      state.activeQuizId = null;
      state.activeQuizTakerId = null;
      state.questions = [];
      state.currentQuizAnswers = {};

      // Clean attendance scan boxes
      if (document.getElementById('staff-quiz-userid')) document.getElementById('staff-quiz-userid').value = '';
      if (document.getElementById('admin-quiz-userid')) document.getElementById('admin-quiz-userid').value = '';
    })
    .catch(err => {
      showToast(err.message, 'error');
    });
}

// ==========================================
// ADMIN DASHBOARD FLOWS
// ==========================================
function loadAdminRoleDashboard() {
  document.getElementById('admin-dash-title').innerText = `ห้องควบคุมระบบสูงสุด: ${state.user.PreName}${state.user.Name}`;

  // Profile Previews
  renderAdminProfileData();

  // Reload Full stats & Users
  callBackend('getDashboardStats', ['Admin', state.user.UserID, null])
    .then(stats => {
      state.dashboardStats = stats;

      // Render general Admin stats
      document.getElementById('admin-val-total-users').innerText = stats.overall.totalUsers;
      document.getElementById('admin-val-total-activities').innerText = stats.overall.totalActivities;
      document.getElementById('admin-val-total-boonpoint').innerText = stats.overall.totalPointsAwarded;

      // Render users CRUD table
      callBackend('getAllUsers', [])
    .then(users => {
          renderAdminUsersTable(users);
        });

      // Render activity attendance forms dropdown
      loadAttendanceActivityOptions();

      // Render quiz selections
      loadQuizOptions();

      // Render activity list in configuration pane
      loadAdminActivitiesConfigTable();

      // Render quiz sets list in configuration pane
      loadAdminQuizzesConfigTable();
    })
    .catch(err => {
      showToast('ไม่สามารถดึงข้อมูลระบบหลังบ้านได้: ' + err.message, 'error');
    });
}

function renderAdminProfileData() {
  document.getElementById('admin-prof-avatar').src = state.user.Photo && state.user.Photo !== '' ? state.user.Photo : 'https://img.icons8.com/ios-custom/90/cccccc/user-female-circle.png';
  document.getElementById('admin-prof-prename').value = state.user.PreName;
  document.getElementById('admin-prof-name').value = state.user.Name;
  document.getElementById('admin-prof-lastname').value = state.user.LastName;
  document.getElementById('admin-prof-nickname').value = state.user.NickName || '';
  document.getElementById('admin-prof-birthday').value = formatBirthdayForInput(state.user.Birthday);
  document.getElementById('admin-prof-department').value = state.user.Department || '';
}

function toggleAdminProfileEdit(editable) {
  const fields = ['admin-prof-prename', 'admin-prof-name', 'admin-prof-lastname', 'admin-prof-nickname', 'admin-prof-birthday', 'admin-prof-photo'];
  fields.forEach(id => {
    document.getElementById(id).disabled = !editable;
  });

  if (editable) {
    document.getElementById('admin-prof-edit-actions').classList.remove('hidden');
    document.getElementById('btn-start-admin-prof-edit').classList.add('hidden');
  } else {
    document.getElementById('admin-prof-edit-actions').classList.add('hidden');
    document.getElementById('btn-start-admin-prof-edit').classList.remove('hidden');
    document.getElementById('admin-prof-photo').value = '';
    renderAdminProfileData();
  }
}

async function handleAdminProfileUpdate(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('btn-save-admin-profile');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'กำลังบันทึก...';

  const photoFile = document.getElementById('admin-prof-photo').files[0];
  let photoUrl = state.user.Photo || '';

  try {
    if (photoFile) {
      const base64 = await toBase64(photoFile);
      photoUrl = await uploadFileToServer(base64, `profile_${state.user.UserID}_${photoFile.name}`);
    }

    const updatedUser = {
      ...state.user,
      PreName: document.getElementById('admin-prof-prename').value,
      Name: document.getElementById('admin-prof-name').value.trim(),
      LastName: document.getElementById('admin-prof-lastname').value.trim(),
      NickName: document.getElementById('admin-prof-nickname').value.trim(),
      Birthday: document.getElementById('admin-prof-birthday').value,
      Photo: photoUrl
    };

    callBackend('updateUserProfile', [updatedUser, state.user.Role])
    .then(res => {
        state.user = updatedUser;
        showToast('ปรับปรุงข้อมูลส่วนตัวสำเร็จ!', 'success');
        document.getElementById('admin-prof-photo').value = '';
        toggleAdminProfileEdit(false);
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'บันทึก';

        document.getElementById('user-profile-name').innerText = `${updatedUser.PreName}${updatedUser.Name}`;
        if (updatedUser.Photo && updatedUser.Photo !== '') {
          document.getElementById('user-profile-img').src = updatedUser.Photo;
          document.getElementById('user-profile-img').classList.remove('hidden');
        }
      })
    .catch(err => {
        showToast('ปรับปรุงข้อมูลล้มเหลว: ' + err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'บันทึก';
      });

  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'บันทึก';
  }
}

function renderAdminUsersTable(usersList) {
  const tbody = document.getElementById('admin-users-table-body');
  tbody.innerHTML = '';
  if (usersList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-secondary">ไม่มีข้อมูลสมาชิกในระบบ</td></tr>';
    return;
  }

  usersList.forEach(u => {
    const row = document.createElement('tr');

    let photoHtml = '<img src="https://img.icons8.com/ios-glyphs/30/cccccc/user-female-circle.png" class="avatar-thumb" />';
    if (u.Photo && u.Photo.trim() !== '') {
      photoHtml = `<img src="${u.Photo}" class="avatar-thumb" />`;
    }

    let roleClass = 'badge-user';
    if (u.Role === 'Admin') roleClass = 'badge-admin';
    if (u.Role === 'Staff') roleClass = 'badge-staff';

    row.innerHTML = `
      <td class="text-center">${photoHtml}</td>
      <td>${u.UserID}</td>
      <td><a href="#" style="color: var(--accent-blue); text-decoration: underline; font-weight: 500;" onclick="viewMemberHistory('${u.UserID}'); return false;">${u.PreName}${u.Name} ${u.LastName}</a></td>
      <td>${u.NickName || '-'}</td>
      <td>${u.Department || 'ไม่ระบุ'}</td>
      <td><span class="badge badge-user">${u.Level}</span></td>
      <td><span class="badge ${roleClass}">${u.Role}</span></td>
      <td>
        <button class="btn btn-secondary btn-small" onclick="openEditUserModal('${u.UserID}')">แก้ไข</button>
        <button class="btn btn-danger btn-small" onclick="handleDeleteUser('${u.UserID}')">ลบ</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// User CRUD Modal flows
function openAddUserModal() {
  document.getElementById('user-modal-title').innerText = 'เพิ่มผู้ใช้งานระบบใหม่';
  document.getElementById('user-crud-form').reset();

  // Make UserID input writable for new entries
  document.getElementById('crud-email').readOnly = false;

  // Password group needs to show
  document.getElementById('crud-password-group').classList.remove('hidden');
  document.getElementById('crud-email').required = true;
  document.getElementById('crud-password').required = true;

  openModal('user-crud-modal');
}

function openEditUserModal(userId) {
  document.getElementById('user-modal-title').innerText = `แก้ไขข้อมูลสมาชิก: ${userId}`;
  document.getElementById('user-crud-form').reset();

  // Prevent changing email primary key
  document.getElementById('crud-email').value = userId;
  document.getElementById('crud-email').readOnly = true;

  // Hide password fields to not overwrite unless admin explicitly sets it
  document.getElementById('crud-password-group').classList.add('hidden');
  document.getElementById('crud-email').required = false;
  document.getElementById('crud-password').required = false;

  // Retrieve existing user data to populate
  callBackend('adminSaveUser', [userData])
    .then(users => {
      const u = users.find(x => x.UserID === userId);
      if (u) {
        document.getElementById('crud-prename').value = u.PreName;
        document.getElementById('crud-name').value = u.Name;
        document.getElementById('crud-lastname').value = u.LastName;
        document.getElementById('crud-nickname').value = u.NickName || '';
        document.getElementById('crud-birthday').value = formatBirthdayForInput(u.Birthday);
        document.getElementById('crud-level').value = u.Level || 'New';
        document.getElementById('crud-department').value = u.Department || '';
        document.getElementById('crud-role').value = u.Role || 'User';

        openModal('user-crud-modal');
      } else {
        showToast('ไม่พบข้อมูลของสมาชิกคนนี้', 'error');
      }
    })
    .getAllUsers();
}

async function handleUserCRUDSave(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('crud-user-save-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'กำลังบันทึก...';

  const email = document.getElementById('crud-email').value.trim();
  const pass = document.getElementById('crud-password').value.trim();

  const userData = {
    UserID: email,
    PreName: document.getElementById('crud-prename').value,
    Name: document.getElementById('crud-name').value.trim(),
    LastName: document.getElementById('crud-lastname').value.trim(),
    NickName: document.getElementById('crud-nickname').value.trim(),
    Birthday: document.getElementById('crud-birthday').value,
    Level: document.getElementById('crud-level').value,
    Department: document.getElementById('crud-department').value,
    Role: document.getElementById('crud-role').value
  };

  // If password input is filled/required, set it
  if (pass !== '') {
    userData.Password = pass;
  }

  // Handle image upload from CRUD modal if user selected a new photo
  const photoFile = document.getElementById('crud-photo').files[0];
  try {
    if (photoFile) {
      const b64 = await toBase64(photoFile);
      userData.Photo = await uploadFileToServer(b64, `profile_${email}_${photoFile.name}`);
    }

    callBackend('catch', [err => {
        showToast(err.message, 'error'])
    .then(res => {
        showToast('บันทึกข้อมูลสมาชิกเสร็จสิ้น', 'success');
        closeModal('user-crud-modal');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'บันทึกข้อมูล';

        // Refresh tables based on role context
        if (state.user.Role === 'Staff') loadStaffRoleDashboard();
        if (state.user.Role === 'Admin') loadAdminRoleDashboard();
      });
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'บันทึกข้อมูล';
      });

  } catch (err) {
    showToast('ล้มเหลวในการบันทึกรูปภาพ: ' + err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'บันทึกข้อมูล';
  }
}

function handleDeleteUser(userId) {
  if (confirm(`คุณต้องการลบผู้ใช้ ${userId} ออกจากระบบอย่างถาวรใช่หรือไม่? ข้อมูลประวัติการเข้าร่วม กิจกรรม และความดีสากลจะยังถูกเก็บไว้`)) {
    callBackend('deleteUser', [userId])
    .then(res => {
        showToast('ลบสมาชิกออกจากระบบสำเร็จ', 'success');

        if (state.user.Role === 'Staff') loadStaffRoleDashboard();
        if (state.user.Role === 'Admin') loadAdminRoleDashboard();
      })
    .catch(err => {
        showToast(err.message, 'error');
      });
  }
}

// ActivitySet Config table CRUD
function loadAdminActivitiesConfigTable() {
  const tbody = document.getElementById('admin-activities-table-body');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary">กำลังโหลด...</td></tr>';

  callBackend('saveActivitySet', [actData])
    .then(activities => {
      tbody.innerHTML = '';
      if (activities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary">ยังไม่มีข้อมูลกิจกรรม</td></tr>';
        return;
      }

      activities.forEach(a => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${a.AcID}</td>
          <td><span class="badge" style="background-color:rgba(175,82,222,0.1); color:var(--color-purple);">${a.AcType}</span></td>
          <td class="text-bold">${a.Title}</td>
          <td>${formatDateOnly(a.Startdate)} ถึง ${formatDateOnly(a.EndDate)}</td>
          <td class="text-center">${a.BoonScore}</td>
          <td class="text-center">${a.ParticipantCount} / ${a.TargetCount}</td>
          <td>
            <button class="btn btn-secondary btn-small" onclick="openEditActivityModal('${a.AcID}')">แก้ไข</button>
            <button class="btn btn-danger btn-small" onclick="handleDeleteActivity('${a.AcID}')">ลบ</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    })
    .getActivitySets();
}

function openAddActivityModal() {
  document.getElementById('activity-modal-title').innerText = 'เพิ่มกิจกรรมใหม่';
  document.getElementById('activity-crud-form').reset();
  document.getElementById('crud-act-id').readOnly = false;
  openModal('activity-crud-modal');
}

function openEditActivityModal(acId) {
  document.getElementById('activity-modal-title').innerText = `แก้ไขข้อมูลกิจกรรม: ${acId}`;
  document.getElementById('activity-crud-form').reset();

  document.getElementById('crud-act-id').value = acId;
  document.getElementById('crud-act-id').readOnly = true;

  // Find element
  callBackend('getActivitySets', [])
    .then(activities => {
      const a = activities.find(x => x.AcID === acId);
      if (a) {
        document.getElementById('crud-act-type').value = a.AcType;
        document.getElementById('crud-act-title').value = a.Title;
        document.getElementById('crud-act-desc').value = a.Description || '';
        document.getElementById('crud-act-start').value = formatDateOnly(a.Startdate);
        document.getElementById('crud-act-end').value = formatDateOnly(a.EndDate);
        document.getElementById('crud-act-score').value = a.BoonScore;
        document.getElementById('crud-act-status').value = a.Status;
        document.getElementById('crud-act-target').value = a.TargetCount;

        openModal('activity-crud-modal');
      } else {
        showToast('ไม่พบข้อมูลกิจกรรมนี้', 'error');
      }
    });
}

function handleActivityCRUDSave(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('crud-act-save-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'กำลังบันทึก...';

  const actData = {
    AcID: document.getElementById('crud-act-id').value.trim(),
    AcType: document.getElementById('crud-act-type').value,
    Title: document.getElementById('crud-act-title').value.trim(),
    Description: document.getElementById('crud-act-desc').value.trim(),
    Startdate: document.getElementById('crud-act-start').value,
    EndDate: document.getElementById('crud-act-end').value,
    BoonScore: Number(document.getElementById('crud-act-score').value) || 0,
    Status: document.getElementById('crud-act-status').value,
    TargetCount: Number(document.getElementById('crud-act-target').value) || 0
  };

  callBackend('catch', [err => {
      showToast(err.message, 'error'])
    .then(res => {
      showToast('บันทึกข้อมูลกิจกรรมสำเร็จ', 'success');
      closeModal('activity-crud-modal');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'บันทึกข้อมูล';
      loadAdminRoleDashboard();
    });
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'บันทึกข้อมูล';
    });
}

function handleDeleteActivity(acId) {
  if (confirm(`คุณแน่ใจว่าต้องการลบกิจกรรม ${acId} ใช่หรือไม่?`)) {
    callBackend('deleteActivitySet', [acId])
    .then(res => {
        showToast('ลบกิจกรรมสำเร็จ', 'success');
        loadAdminRoleDashboard();
      })
    .catch(err => {
        showToast(err.message, 'error');
      });
  }
}

// Quiz Sets Config table CRUD
function loadAdminQuizzesConfigTable() {
  const tbody = document.getElementById('admin-quizset-table-body');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary">กำลังโหลด...</td></tr>';

  callBackend('saveQuizSet', [qData])
    .then(quizzes => {
      tbody.innerHTML = '';
      if (quizzes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary">ยังไม่มีชุดข้อสอบศีลธรรม</td></tr>';
        return;
      }

      quizzes.forEach(q => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${q.QuizsetID}</td>
          <td class="text-bold">${q.Title}</td>
          <td>${q.Description || '-'}</td>
          <td><span class="badge ${q.Status === 'Active' ? 'badge-user' : 'badge-admin'}">${q.Status}</span></td>
          <td>
            <button class="btn btn-secondary btn-small" onclick="openEditQuizModal('${q.QuizsetID}')">แก้ไข</button>
            <button class="btn btn-outline btn-small" onclick="openQuestionsManagerModal('${q.QuizsetID}')">จัดการคำถาม</button>
            <button class="btn btn-danger btn-small" onclick="handleDeleteQuiz('${q.QuizsetID}')">ลบ</button>
          </td>
        `;
        tbody.appendChild(row);
      });
    })
    .getQuizSets();
}

function openAddQuizModal() {
  document.getElementById('quiz-modal-title').innerText = 'เพิ่มชุดข้อสอบใหม่';
  document.getElementById('quiz-crud-form').reset();
  document.getElementById('crud-quiz-id').readOnly = false;
  openModal('quiz-crud-modal');
}

function openEditQuizModal(quizId) {
  document.getElementById('quiz-modal-title').innerText = `แก้ไขชุดข้อสอบ: ${quizId}`;
  document.getElementById('quiz-crud-form').reset();

  document.getElementById('crud-quiz-id').value = quizId;
  document.getElementById('crud-quiz-id').readOnly = true;

  callBackend('getQuizSets', [])
    .then(quizzes => {
      const q = quizzes.find(x => x.QuizsetID === quizId);
      if (q) {
        document.getElementById('crud-quiz-title').value = q.Title;
        document.getElementById('crud-quiz-desc').value = q.Description || '';
        document.getElementById('crud-quiz-status').value = q.Status;

        openModal('quiz-crud-modal');
      } else {
        showToast('ไม่พบชุดข้อสอบนี้', 'error');
      }
    });
}

function handleQuizCRUDSave(e) {
  e.preventDefault();

  const submitBtn = document.getElementById('crud-quiz-save-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'กำลังบันทึก...';

  const qData = {
    QuizsetID: document.getElementById('crud-quiz-id').value.trim(),
    Title: document.getElementById('crud-quiz-title').value.trim(),
    Description: document.getElementById('crud-quiz-desc').value.trim(),
    Status: document.getElementById('crud-quiz-status').value
  };

  callBackend('catch', [err => {
      showToast(err.message, 'error'])
    .then(res => {
      showToast('บันทึกชุดข้อสอบธรรมะเสร็จสิ้น', 'success');
      closeModal('quiz-crud-modal');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'บันทึกข้อมูล';
      loadAdminRoleDashboard();
    });
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'บันทึกข้อมูล';
    });
}

function handleDeleteQuiz(quizId) {
  if (confirm(`คุณต้องการลบข้อสอบชุด ${quizId} และลบคำถามทั้งหมดที่ผูกกับชุดนี้ ใช่หรือไม่?`)) {
    callBackend('deleteQuizSet', [quizId])
    .then(res => {
        showToast('ลบข้อสอบธรรมะสำเร็จ', 'success');
        loadAdminRoleDashboard();
      })
    .catch(err => {
        showToast(err.message, 'error');
      });
  }
}

// Question Manager Modal Flow
let activeQuestionSetQuizId = null;

function openQuestionsManagerModal(quizId) {
  activeQuestionSetQuizId = quizId;
  document.getElementById('q-mgr-modal-title').innerText = `จัดการคำถามข้อสอบชุด: ${quizId}`;

  const wrapper = document.getElementById('q-mgr-questions-list');
  wrapper.innerHTML = '<p class="text-secondary text-center">กำลังโหลดคำถาม...</p>';

  callBackend('saveQuizQuestions', [activeQuestionSetQuizId, questionsToSave])
    .then(questions => {
      wrapper.innerHTML = '';
      if (questions.length === 0) {
        addDynamicQuestionFormRow(); // Add empty row
      } else {
        questions.forEach(q => addDynamicQuestionFormRow(q));
      }
      openModal('questions-manager-modal');
    })
    .getQuestions(quizId);
}

function addDynamicQuestionFormRow(data = null) {
  const wrapper = document.getElementById('q-mgr-questions-list');
  const count = wrapper.children.length;
  
  const row = document.createElement('div');
  row.className = 'goodness-card mb-4';
  row.style.position = 'relative';
  row.innerHTML = `
    <button type="button" class="btn btn-danger btn-small" style="position:absolute; top:12px; right:12px; padding:2px 8px;" onclick="this.parentElement.remove()">ลบข้อ</button>
    <div style="font-weight:600; font-size:12px; color:var(--accent-blue); margin-bottom:8px;">คำถามข้อที่ <span class="q-number-label">${count + 1}</span></div>
    
    <div class="form-group">
      <label>โจทย์คำถาม *</label>
      <input type="text" class="q-text-input" required value="${data ? data.QuestionText.replace(/"/g, '&quot;') : ''}" placeholder="ระบุเนื้อหาคำถาม" />
    </div>
    
    <div class="goodness-grid">
      <div class="form-group">
        <label>ตัวเลือกที่ 1 *</label>
        <input type="text" class="q-choice-1" required value="${data ? data.Choice1.replace(/"/g, '&quot;') : ''}" placeholder="ตัวเลือก ก." />
      </div>
      <div class="form-group">
        <label>ตัวเลือกที่ 2 *</label>
        <input type="text" class="q-choice-2" required value="${data ? data.Choice2.replace(/"/g, '&quot;') : ''}" placeholder="ตัวเลือก ข." />
      </div>
      <div class="form-group">
        <label>ตัวเลือกที่ 3 *</label>
        <input type="text" class="q-choice-3" required value="${data ? data.Choice3.replace(/"/g, '&quot;') : ''}" placeholder="ตัวเลือก ค." />
      </div>
      <div class="form-group">
        <label>ตัวเลือกที่ 4 *</label>
        <input type="text" class="q-choice-4" required value="${data ? data.Choice4.replace(/"/g, '&quot;') : ''}" placeholder="ตัวเลือก ง." />
      </div>
    </div>
    
    <div class="form-group">
      <label>ตัวเลือกคำตอบที่ถูกต้อง *</label>
      <select class="q-correct-answer" required>
        <option value="">-- เลือกคำตอบที่ถูกต้อง --</option>
        <option value="1" ${data && String(data.CorectAnswer).trim() === String(data.Choice1).trim() ? 'selected' : ''}>ตัวเลือกที่ 1</option>
        <option value="2" ${data && String(data.CorectAnswer).trim() === String(data.Choice2).trim() ? 'selected' : ''}>ตัวเลือกที่ 2</option>
        <option value="3" ${data && String(data.CorectAnswer).trim() === String(data.Choice3).trim() ? 'selected' : ''}>ตัวเลือกที่ 3</option>
        <option value="4" ${data && String(data.CorectAnswer).trim() === String(data.Choice4).trim() ? 'selected' : ''}>ตัวเลือกที่ 4</option>
      </select>
      <span style="font-size:10px; color:var(--text-secondary);">คำตอบจะถูกเปรียบเทียบจากค่าตัวเลือกที่กรอกโดยตรง</span>
    </div>
  `;
  wrapper.appendChild(row);
}

function saveAdminQuestionsList() {
  const wrapper = document.getElementById('q-mgr-questions-list');
  const rows = wrapper.children;
  const questionsToSave = [];
  
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const qText = r.querySelector('.q-text-input').value.trim();
    const ch1 = r.querySelector('.q-choice-1').value.trim();
    const ch2 = r.querySelector('.q-choice-2').value.trim();
    const ch3 = r.querySelector('.q-choice-3').value.trim();
    const ch4 = r.querySelector('.q-choice-4').value.trim();
    const correctIdx = r.querySelector('.q-correct-answer').value;
    
    if (!qText || !ch1 || !ch2 || !ch3 || !ch4 || !correctIdx) {
      showToast('กรุณากรอกข้อมูลโจทย์ ตัวเลือก และเฉลยข้อสอบของทุกข้อที่เพิ่ม', 'error');
      return;
    }
    
    let correctValue = '';
    if (correctIdx === '1') correctValue = ch1;
    if (correctIdx === '2') correctValue = ch2;
    if (correctIdx === '3') correctValue = ch3;
    if (correctIdx === '4') correctValue = ch4;
    
    questionsToSave.push({
      QuestionText: qText,
      Choice1: ch1,
      Choice2: ch2,
      Choice3: ch3,
      Choice4: ch4,
      CorectAnswer: correctValue // Column header spelling: CorectAnswer
    });
  }
  
  const submitBtn = document.getElementById('btn-save-questions-mgr');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'กำลังบันทึก...';
  
  callBackend('catch', [err => {
      showToast(err.message, 'error'])
    .then(res => {
      showToast(`บันทึกคำถามข้อสอบสำเร็จเรียบร้อย! ทั้งหมด ${questionsToSave.length} ข้อ`, 'success');
      closeModal('questions-manager-modal');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'บันทึกคำถาม';
      activeQuestionSetQuizId = null;
    });
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'บันทึกคำถาม';
    });
}

// ==========================================
// CLIENT HANDLERS: FILE & HELPERS
// ==========================================
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function uploadFileToServer(base64Data, filename) {
  return new Promise((resolve, reject) => {
    callBackend('uploadFile', [base64Data, filename])
    .then(url => resolve(url))
    .catch(err => reject(err));
  });
}

// Visual helpers
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function switchTab(btn, tabId, rolePrefix) {
  // Reset buttons
  document.querySelectorAll(`.${rolePrefix}-tab-btn`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  // Hide all contents
  document.querySelectorAll(`.${rolePrefix}-tab-content`).forEach(c => c.classList.add('hidden'));
  document.getElementById(tabId).classList.remove('hidden');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-wrapper');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <span class="toast-close" onclick="this.parentElement.remove()">&times;</span>
  `;
  container.appendChild(toast);
  
  // Auto-remove toast
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Date helpers
function formatDateString(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleString('th-TH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateOnly(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).substring(0,10);
  
  // Format as yyyy-MM-dd for HTML5 date inputs
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const r = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${r}`;
}

function viewMemberHistory(userId) {
  document.getElementById('member-history-title').innerText = `ประวัติการสะสมแต้มของสมาชิก: ${userId}`;
  
  // Render loading indicators
  document.getElementById('member-total-boonpoint').innerText = '...';
  document.getElementById('member-act-pts').innerText = '...';
  document.getElementById('member-quiz-pts').innerText = '...';
  document.getElementById('member-goodness-pts').innerText = '...';
  
  document.getElementById('member-activity-table-body').innerHTML = '<tr><td colspan="4" class="text-center text-secondary">กำลังโหลด...</td></tr>';
  document.getElementById('member-quiz-table-body').innerHTML = '<tr><td colspan="5" class="text-center text-secondary">กำลังโหลด...</td></tr>';
  document.getElementById('member-goodness-table-body').innerHTML = '<tr><td colspan="4" class="text-center text-secondary">กำลังโหลด...</td></tr>';
  
  openModal('member-history-modal');
  
  callBackend('getDashboardStats', ['User', userId, null])
    .then(stats => {
      const pts = stats.user.totalBoonPoints || 0;
      document.getElementById('member-total-boonpoint').innerText = pts;
      document.getElementById('member-act-pts').innerText = stats.user.activityPoints + ' แต้ม';
      document.getElementById('member-quiz-pts').innerText = stats.user.quizPoints + ' แต้ม';
      document.getElementById('member-goodness-pts').innerText = stats.user.goodnessPoints + ' แต้ม';
      
      // Render Activity History Table
      const actTable = document.getElementById('member-activity-table-body');
      actTable.innerHTML = '';
      if (stats.user.activityHistory.length === 0) {
        actTable.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">ยังไม่มีข้อมูลการร่วมกิจกรรม</td></tr>';
      } else {
        stats.user.activityHistory.forEach(a => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${a.AcId}</td>
            <td>${a.title}</td>
            <td>${formatDateString(a.Timestamp)}</td>
            <td class="text-bold text-success">+${a.BoonScore}</td>
          `;
          actTable.appendChild(row);
        });
      }
      
      // Render Quiz History Table
      const quizTable = document.getElementById('member-quiz-table-body');
      quizTable.innerHTML = '';
      if (stats.user.quizHistory.length === 0) {
        quizTable.innerHTML = '<tr><td colspan="5" class="text-center text-secondary">ยังไม่มีประวัติการทำข้อสอบ</td></tr>';
      } else {
        stats.user.quizHistory.forEach(q => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${q.QuizsetId}</td>
            <td>${q.title}</td>
            <td>${formatDateString(q.Timestamp)}</td>
            <td class="text-center">${q.BoonScore} / ${q.MaxScore}</td>
            <td class="text-bold text-success">+${q.BoonScore}</td>
          `;
          quizTable.appendChild(row);
        });
      }
      
      // Render Goodness logs
      const goodnessTable = document.getElementById('member-goodness-table-body');
      goodnessTable.innerHTML = '';
      if (stats.user.goodnessLogs.length === 0) {
        goodnessTable.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">ยังไม่มีการบันทึกความดีสากล</td></tr>';
      } else {
        stats.user.goodnessLogs.forEach(g => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${formatDateOnly(g.DoDate)}</td>
            <td>
              <span class="badge" style="background-color:rgba(0,113,227,0.05); color:var(--text-primary);">
                ทาน: ${g.GivingPoint} | ศีล: ${g.SilaPoint} | สะอาด: ${g.CleanPoint} | ระเบียบ: ${g.ArrayPoint} | สุภาพ: ${g.PolitePoint} | ตรงเวลา: ${g.OntimePoint} | สมาธิ: ${g.MeditatePoint}
              </span>
            </td>
            <td class="text-center">${g.sumPoint} / 7</td>
            <td class="text-bold text-success">+${g.sumPoint}</td>
          `;
          goodnessTable.appendChild(row);
        });
      }
    })
    .catch(err => {
      showToast('ไม่สามารถดึงข้อมูลสมาชิกรายคนได้: ' + err.message, 'error');
      closeModal('member-history-modal');
    });
}

function formatBirthdayForInput(val) {
  if (!val) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(val).trim())) {
    return String(val).trim();
  }
  
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    const match = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
    return String(val);
  }
  
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const r = String(d.getDate()).padStart(2, '0');
  return `${r}/${m}/${y}`;
}

function applyDateMask(input) {
  input.addEventListener('input', function(e) {
    let value = this.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);
    
    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 2);
      if (value.length > 2) {
        formatted += '/' + value.substring(2, 4);
        if (value.length > 4) {
          formatted += '/' + value.substring(4, 8);
        }
      }
    }
    this.value = formatted;
  });
}