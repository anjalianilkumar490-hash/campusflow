// REGISTER
function register() {
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value.trim();
    const role = document.getElementById("registerRole").value.trim();

    if (!email || !password || !role) {
        alert("Please fill all fields");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];

    const userExists = users.find(user => user.email === email);
    if (userExists) {
        alert("Email already registered!");
        return;
    }

    users.push({ email, password, role });
    localStorage.setItem("users", JSON.stringify(users));

    console.log("Registration successful for:", email, "Role:", role);
    alert("Registration Successful! Please login.");
    window.location.href = "index.html";
}

// LOGIN
function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];

    console.log("Attempting login with:", email);
    console.log("Available users:", users);

    const user = users.find(user => user.email === email && user.password === password);

    if (!user) {
        console.log("User not found or password incorrect");
        alert("Invalid email or password");
        return;
    }

    console.log("Login successful for:", user.email, "Role:", user.role);
    localStorage.setItem("currentUser", JSON.stringify(user));

    if (user.role === "teacher") {
        window.location.href = "teacher.html";
    } else if (user.role === "student") {
        window.location.href = "student.html";
    } else {
        alert("Invalid user role");
    }
}

// CHECK AUTH
function checkAuth(role) {
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!user || user.role !== role) {
        window.location.href = "index.html";
    }

    // For teacher dashboard
    if (document.getElementById('userInfo')) {
        document.getElementById('userInfo').innerHTML = `<i class="fas fa-user-circle"></i> ${user.email}`;
    }
}

// LOGOUT
function logout() {
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
}

// ==================== TEACHER DASHBOARD FUNCTIONS ====================

// Get current teacher's email
function getCurrentTeacher() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    return user ? user.email : null;
}

// ==================== TAB NAVIGATION ====================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked nav item
    event.target.closest('.nav-item').classList.add('active');

    // Load data for the tab
    if (tabName === 'rooms') {
        loadRooms();
    } else if (tabName === 'pending') {
        loadPendingRequests();
    } else if (tabName === 'approved') {
        loadApprovedEvents();
    } else if (tabName === 'calendar') {
        loadCalendarEvents();
    }
}

// ==================== ROOM MANAGEMENT ====================

function addRoom(event) {
    event.preventDefault();

    const roomName = document.getElementById('roomName').value;
    const roomCapacity = document.getElementById('roomCapacity').value;

    if (!roomName || !roomCapacity) {
        alert('Please fill all fields');
        return;
    }

    const teacher = getCurrentTeacher();
    let rooms = JSON.parse(localStorage.getItem("rooms")) || [];

    const newRoom = {
        id: Date.now().toString(),
        name: roomName,
        capacity: parseInt(roomCapacity),
        teacher: teacher,
        createdAt: new Date().toISOString(),
        status: 'active'
    };

    rooms.push(newRoom);
    localStorage.setItem("rooms", JSON.stringify(rooms));

    alert('Room added successfully!');
    document.getElementById('roomName').value = '';
    document.getElementById('roomCapacity').value = '';
    loadRooms();
    loadTeacherData();
}

function loadRooms() {
    const teacher = getCurrentTeacher();
    let rooms = JSON.parse(localStorage.getItem("rooms")) || [];
    
    // Filter rooms for current teacher
    rooms = rooms.filter(room => room.teacher === teacher && room.status !== 'deleted');

    const roomsList = document.getElementById('roomsList');
    
    if (rooms.length === 0) {
        roomsList.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No rooms added yet. Create your first room!</p></div>';
        return;
    }

    roomsList.innerHTML = rooms.map(room => `
        <div class="room-card">
            <div class="room-header">
                <h3><i class="fas fa-door-open"></i> ${room.name}</h3>
                <span class="room-id">ID: ${room.id.substring(0, 8)}</span>
            </div>
            <div class="room-details">
                <p><strong>Capacity:</strong> <span class="capacity-badge">${room.capacity} people</span></p>
                <p><strong>Status:</strong> <span class="status-badge active">${room.status}</span></p>
            </div>
            <div class="room-actions">
                <button class="btn-secondary" onclick="editRoom('${room.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-danger" onclick="deleteRoom('${room.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function deleteRoom(roomId) {
    if (!confirm('Are you sure you want to delete this room?')) return;

    let rooms = JSON.parse(localStorage.getItem("rooms")) || [];
    const roomIndex = rooms.findIndex(r => r.id === roomId);
    
    if (roomIndex > -1) {
        rooms[roomIndex].status = 'deleted';
        localStorage.setItem("rooms", JSON.stringify(rooms));
        alert('Room deleted successfully!');
        loadRooms();
        loadTeacherData();
    }
}

function editRoom(roomId) {
    let rooms = JSON.parse(localStorage.getItem("rooms")) || [];
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) return;

    const newName = prompt('Enter new room name:', room.name);
    if (newName === null) return;

    const newCapacity = prompt('Enter new capacity:', room.capacity);
    if (newCapacity === null) return;

    if (!newName || !newCapacity) {
        alert('Please fill all fields');
        return;
    }

    room.name = newName;
    room.capacity = parseInt(newCapacity);
    localStorage.setItem("rooms", JSON.stringify(rooms));
    
    alert('Room updated!');
    loadRooms();
    loadTeacherData();
}

// ==================== CALENDAR ====================

let currentMonth = new Date();

function setupCalendar() {
    renderCalendar();
    loadCalendarEvents();
}

function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Update header
    const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    document.getElementById('currentMonth').textContent = monthYear;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    weekDays.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });

    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        const isToday = dateString === new Date().toISOString().split('T')[0];
        
        html += `
            <div class="calendar-date ${isToday ? 'today' : ''}" onclick="selectDate('${dateString}'); return false;">
                ${day}
            </div>
        `;
    }

    document.getElementById('calendarGrid').innerHTML = html;
    
    // Select today by default
    selectDate(new Date().toISOString().split('T')[0]);
}

function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
    return false;
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
    return false;
}

function selectDate(dateString) {
    const selected = document.querySelector('.calendar-date.selected');
    if (selected) selected.classList.remove('selected');
    
    const dateEl = document.querySelector(`[onclick="selectDate('${dateString}'); return false;"]`);
    if (dateEl) dateEl.classList.add('selected');
    
    loadDayEvents(dateString);
}

function loadDayEvents(dateString) {
    const date = new Date(dateString);
    const dateDisplay = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    document.getElementById('selectedDate').textContent = dateDisplay;

    const teacher = getCurrentTeacher();
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    // Filter approved bookings for this date
    const dayEvents = bookings.filter(booking => {
        const bookingDate = booking.date;
        return booking.teacher === teacher && booking.status === 'approved' && bookingDate === dateString;
    });

    const eventsList = document.getElementById('dayEvents');
    
    if (dayEvents.length === 0) {
        eventsList.innerHTML = '<div class="empty-state"><i class="fas fa-calendar"></i><p>No events for this date</p></div>';
        return;
    }

    eventsList.innerHTML = dayEvents.map(event => `
        <div class="event-card">
            <div class="event-time">
                <i class="fas fa-clock"></i> ${event.time}
            </div>
            <div class="event-info">
                <h4>${event.roomName}</h4>
                <p><strong>Student:</strong> ${event.studentName}</p>
                <p><strong>Duration:</strong> ${event.duration} hours</p>
                <p><strong>Purpose:</strong> ${event.purpose}</p>
            </div>
        </div>
    `).join('');
}

function loadCalendarEvents() {
    renderCalendar();
}

// ==================== PENDING REQUESTS ====================

function loadPendingRequests() {
    const teacher = getCurrentTeacher();
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    // Filter pending requests for current teacher
    const pending = bookings.filter(b => b.teacher === teacher && b.status === 'pending');

    const pendingList = document.getElementById('pendingList');
    
    if (pending.length === 0) {
        pendingList.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No pending requests</p></div>';
        return;
    }

    pendingList.innerHTML = `
        <div class="requests-container">
            ${pending.map(booking => `
                <div class="request-card">
                    <div class="request-header">
                        <h3><i class="fas fa-user"></i> ${booking.studentName}</h3>
                        <span class="request-id">Request ID: ${booking.id.substring(0, 8)}</span>
                    </div>
                    <div class="request-details">
                        <div class="detail-row">
                            <span class="detail-label">Room:</span>
                            <span class="detail-value"><i class="fas fa-door-open"></i> ${booking.roomName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Date:</span>
                            <span class="detail-value"><i class="fas fa-calendar"></i> ${booking.date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Time:</span>
                            <span class="detail-value"><i class="fas fa-clock"></i> ${booking.time}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Duration:</span>
                            <span class="detail-value">${booking.duration} hours</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Purpose:</span>
                            <span class="detail-value">${booking.purpose}</span>
                        </div>
                    </div>
                    <div class="request-actions">
                        <button class="btn-approve" onclick="approveRequest('${booking.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-reject" onclick="rejectRequest('${booking.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function approveRequest(bookingId) {
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const booking = bookings.find(b => b.id === bookingId);

    if (booking) {
        booking.status = 'approved';
        booking.approvedAt = new Date().toISOString();
        localStorage.setItem("bookings", JSON.stringify(bookings));
        alert('Request approved!');
        loadPendingRequests();
        loadTeacherData();
        updatePendingBadge();
    }
}

function rejectRequest(bookingId) {
    const reason = prompt('Enter reason for rejection:');
    if (reason === null) return;

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const booking = bookings.find(b => b.id === bookingId);

    if (booking) {
        booking.status = 'rejected';
        booking.rejectionReason = reason;
        booking.rejectedAt = new Date().toISOString();
        localStorage.setItem("bookings", JSON.stringify(bookings));
        alert('Request rejected!');
        loadPendingRequests();
        loadTeacherData();
        updatePendingBadge();
    }
}

// ==================== APPROVED EVENTS ====================

function loadApprovedEvents() {
    const teacher = getCurrentTeacher();
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    // Filter approved bookings for current teacher
    const approved = bookings.filter(b => b.teacher === teacher && b.status === 'approved');

    const approvedList = document.getElementById('approvedList');
    
    if (approved.length === 0) {
        approvedList.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-check"></i><p>No approved events yet</p></div>';
        return;
    }

    approvedList.innerHTML = `
        <div class="approved-container">
            ${approved.map(event => `
                <div class="approved-card">
                    <div class="approved-header">
                        <h3><i class="fas fa-check-circle"></i> ${event.roomName}</h3>
                        <span class="event-id">Event ID: ${event.id.substring(0, 8)}</span>
                    </div>
                    <div class="approved-details">
                        <div class="detail-row">
                            <span class="detail-label">Student:</span>
                            <span class="detail-value"><i class="fas fa-user"></i> ${event.studentName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Date:</span>
                            <span class="detail-value"><i class="fas fa-calendar"></i> ${event.date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Time:</span>
                            <span class="detail-value"><i class="fas fa-clock"></i> ${event.time}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Duration:</span>
                            <span class="detail-value">${event.duration} hours</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Purpose:</span>
                            <span class="detail-value">${event.purpose}</span>
                        </div>
                    </div>
                    <div class="approved-actions">
                        <button class="btn-secondary" onclick="cancelEvent('${event.id}')">
                            <i class="fas fa-ban"></i> Cancel Event
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function cancelEvent(eventId) {
    if (!confirm('Are you sure you want to cancel this event?')) return;

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const event = bookings.find(b => b.id === eventId);

    if (event) {
        event.status = 'cancelled';
        event.cancelledAt = new Date().toISOString();
        localStorage.setItem("bookings", JSON.stringify(bookings));
        alert('Event cancelled!');
        loadApprovedEvents();
        loadTeacherData();
    }
}

// ==================== DASHBOARD STATS ====================

function loadTeacherData() {
    const teacher = getCurrentTeacher();
    let rooms = JSON.parse(localStorage.getItem("rooms")) || [];
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    // Count rooms
    const totalRooms = rooms.filter(r => r.teacher === teacher && r.status !== 'deleted').length;
    document.getElementById('totalRooms').textContent = totalRooms;

    // Count pending requests
    const pendingCount = bookings.filter(b => b.teacher === teacher && b.status === 'pending').length;
    document.getElementById('totalPending').textContent = pendingCount;
    document.getElementById('pendingBadge').textContent = pendingCount;

    // Count approved events
    const approvedCount = bookings.filter(b => b.teacher === teacher && b.status === 'approved').length;
    document.getElementById('totalApproved').textContent = approvedCount;
}

function updatePendingBadge() {
    const teacher = getCurrentTeacher();
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const pendingCount = bookings.filter(b => b.teacher === teacher && b.status === 'pending').length;
    document.getElementById('pendingBadge').textContent = pendingCount;
}

// ==================== STUDENT DASHBOARD FUNCTIONS ====================

// Get current student's email
function getCurrentStudent() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    return user ? user.email : null;
}

// Switch tabs for student dashboard
function switchStudentTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked nav item
    event.target.closest('.nav-item').classList.add('active');

    // Load data for the tab
    if (tabName === 'request') {
        loadAvailableRooms();
    } else if (tabName === 'myRequests') {
        loadStudentRequests();
    } else if (tabName === 'approved') {
        loadApprovedBookings();
    } else if (tabName === 'history') {
        loadBookingHistory();
    }
}

// Load available rooms for student to book
function loadAvailableRooms() {
    let rooms = JSON.parse(localStorage.getItem("rooms")) || [];
    
    // Filter active rooms
    rooms = rooms.filter(room => room.status === 'active');

    const roomSelect = document.getElementById('roomSelect');
    const availableRooms = document.getElementById('availableRooms');

    // Populate dropdown
    roomSelect.innerHTML = '<option value="">-- Choose a Room --</option>';
    rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `${room.name} (Capacity: ${room.capacity})`;
        roomSelect.appendChild(option);
    });

    // Display rooms list
    if (rooms.length === 0) {
        availableRooms.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No rooms available at the moment</p></div>';
        return;
    }

    availableRooms.innerHTML = rooms.map(room => `
        <div class="room-card">
            <div class="room-header">
                <h3><i class="fas fa-door-open"></i> ${room.name}</h3>
                <span class="room-id">ID: ${room.id.substring(0, 8)}</span>
            </div>
            <div class="room-details">
                <p><strong>Capacity:</strong> <span class="capacity-badge">${room.capacity} people</span></p>
                <p><strong>Teacher:</strong> ${room.teacher}</p>
                <p><strong>Status:</strong> <span class="status-badge active">${room.status}</span></p>
            </div>
        </div>
    `).join('');
}

// Submit booking request
function submitBookingRequest(event) {
    event.preventDefault();

    const roomId = document.getElementById('roomSelect').value;
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;
    const duration = document.getElementById('bookingDuration').value;
    const purpose = document.getElementById('bookingPurpose').value;

    if (!roomId || !date || !time || !duration || !purpose) {
        alert('Please fill all fields');
        return;
    }

    const student = getCurrentStudent();
    let rooms = JSON.parse(localStorage.getItem("rooms")) || [];
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    // Get room details
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
        alert('Room not found');
        return;
    }

    // Create booking request
    const newBooking = {
        id: Date.now().toString(),
        roomId: room.id,
        roomName: room.name,
        student: student,
        studentName: student.split('@')[0], // Extract name from email
        teacher: room.teacher,
        date: date,
        time: time,
        duration: parseInt(duration),
        purpose: purpose,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    localStorage.setItem("bookings", JSON.stringify(bookings));

    alert('Booking request submitted! Your teacher will review it soon.');
    
    // Clear form
    document.getElementById('roomSelect').value = '';
    document.getElementById('bookingDate').value = '';
    document.getElementById('bookingTime').value = '';
    document.getElementById('bookingDuration').value = '';
    document.getElementById('bookingPurpose').value = '';

    loadStudentData();
    updateRequestsBadge();
}

// Load student's booking requests
function loadStudentRequests() {
    const student = getCurrentStudent();
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    // Filter requests for current student
    const requests = bookings.filter(b => b.student === student && (b.status === 'pending' || b.status === 'rejected'));

    const myRequestsList = document.getElementById('myRequestsList');
    
    if (requests.length === 0) {
        myRequestsList.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No pending or rejected requests</p></div>';
        return;
    }

    myRequestsList.innerHTML = `
        <div class="requests-container">
            ${requests.map(booking => {
                const statusColor = booking.status === 'pending' ? '#ff9f43' : '#ff4757';
                const statusIcon = booking.status === 'pending' ? 'hourglass-half' : 'times-circle';
                
                return `
                    <div class="request-card">
                        <div class="request-header">
                            <h3><i class="fas fa-door-open"></i> ${booking.roomName}</h3>
                            <span class="request-id" style="background: rgba(${booking.status === 'pending' ? '255, 159, 67' : '255, 71, 87'}, 0.1); color: ${statusColor};">
                                <i class="fas fa-${statusIcon}"></i> ${booking.status.toUpperCase()}
                            </span>
                        </div>
                        <div class="request-details">
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value"><i class="fas fa-calendar"></i> ${booking.date}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Time:</span>
                                <span class="detail-value"><i class="fas fa-clock"></i> ${booking.time}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Duration:</span>
                                <span class="detail-value">${booking.duration} hours</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Purpose:</span>
                                <span class="detail-value">${booking.purpose}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Teacher:</span>
                                <span class="detail-value"><i class="fas fa-user"></i> ${booking.teacher}</span>
                            </div>
                            ${booking.rejectionReason ? `
                            <div class="detail-row">
                                <span class="detail-label">Rejection Reason:</span>
                                <span class="detail-value" style="color: #ff4757;">${booking.rejectionReason}</span>
                            </div>
                            ` : ''}
                        </div>
                        <div class="request-actions">
                            <button class="btn-secondary" onclick="cancelStudentRequest('${booking.id}')">
                                <i class="fas fa-trash"></i> Cancel Request
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Cancel booking request
function cancelStudentRequest(bookingId) {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const booking = bookings.find(b => b.id === bookingId);

    if (booking) {
        booking.status = 'cancelled';
        booking.cancelledAt = new Date().toISOString();
        localStorage.setItem("bookings", JSON.stringify(bookings));
        alert('Request cancelled!');
        loadStudentRequests();
        loadStudentData();
        updateRequestsBadge();
    }
}

// Load student's approved bookings
function loadApprovedBookings() {
    const student = getCurrentStudent();
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    // Filter approved bookings for current student
    const approved = bookings.filter(b => b.student === student && b.status === 'approved');

    const approvedBookingsList = document.getElementById('approvedBookingsList');
    
    if (approved.length === 0) {
        approvedBookingsList.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-check"></i><p>No approved bookings yet</p></div>';
        return;
    }

    approvedBookingsList.innerHTML = `
        <div class="approved-container">
            ${approved.map(booking => `
                <div class="approved-card">
                    <div class="approved-header">
                        <h3><i class="fas fa-check-circle"></i> ${booking.roomName}</h3>
                        <span class="event-id">Booking ID: ${booking.id.substring(0, 8)}</span>
                    </div>
                    <div class="approved-details">
                        <div class="detail-row">
                            <span class="detail-label">Date:</span>
                            <span class="detail-value"><i class="fas fa-calendar"></i> ${booking.date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Time:</span>
                            <span class="detail-value"><i class="fas fa-clock"></i> ${booking.time}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Duration:</span>
                            <span class="detail-value">${booking.duration} hours</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Purpose:</span>
                            <span class="detail-value">${booking.purpose}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Teacher:</span>
                            <span class="detail-value"><i class="fas fa-user"></i> ${booking.teacher}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Approved At:</span>
                            <span class="detail-value"><i class="fas fa-check"></i> ${new Date(booking.approvedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Load student's booking history
function loadBookingHistory() {
    const student = getCurrentStudent();
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    // Filter history (approved and cancelled bookings)
    const history = bookings.filter(b => 
        b.student === student && 
        (b.status === 'approved' || b.status === 'cancelled' || b.status === 'rejected')
    );

    const historyList = document.getElementById('historyList');
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No booking history yet</p></div>';
        return;
    }

    historyList.innerHTML = `
        <div class="approved-container">
            ${history.map(booking => {
                let statusColor = '#2ed573';
                let statusIcon = 'check-circle';
                
                if (booking.status === 'cancelled') {
                    statusColor = '#ff9f43';
                    statusIcon = 'ban';
                } else if (booking.status === 'rejected') {
                    statusColor = '#ff4757';
                    statusIcon = 'times-circle';
                }
                
                return `
                    <div class="approved-card">
                        <div class="approved-header">
                            <h3><i class="fas fa-${statusIcon}"></i> ${booking.roomName}</h3>
                            <span class="event-id" style="color: ${statusColor}; background: rgba(${statusColor.replace('#', '')}, 0.1);">
                                ${booking.status.toUpperCase()}
                            </span>
                        </div>
                        <div class="approved-details">
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value"><i class="fas fa-calendar"></i> ${booking.date}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Time:</span>
                                <span class="detail-value"><i class="fas fa-clock"></i> ${booking.time}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Duration:</span>
                                <span class="detail-value">${booking.duration} hours</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Purpose:</span>
                                <span class="detail-value">${booking.purpose}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value" style="color: ${statusColor}; font-weight: bold;">${booking.status.toUpperCase()}</span>
                            </div>
                            ${booking.rejectionReason ? `
                            <div class="detail-row">
                                <span class="detail-label">Reason:</span>
                                <span class="detail-value">${booking.rejectionReason}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Load student dashboard data
function loadStudentData() {
    const student = getCurrentStudent();
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    // Count total requests
    const totalRequests = bookings.filter(b => b.student === student).length;
    document.getElementById('totalRequests').textContent = totalRequests;

    // Count pending requests
    const pendingCount = bookings.filter(b => b.student === student && b.status === 'pending').length;
    document.getElementById('totalPendingStudent').textContent = pendingCount;

    // Count approved bookings
    const approvedCount = bookings.filter(b => b.student === student && b.status === 'approved').length;
    document.getElementById('totalApprovedStudent').textContent = approvedCount;
}

function updateRequestsBadge() {
    const student = getCurrentStudent();
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const requestCount = bookings.filter(b => b.student === student && b.status === 'pending').length;
    document.getElementById('requestsBadge').textContent = requestCount;
}

// Auto-refresh dashboard stats every 30 seconds
setInterval(() => {
    if (document.getElementById('totalRooms')) {
        loadTeacherData();
    } else if (document.getElementById('totalRequests')) {
        loadStudentData();
    }
}, 30000);