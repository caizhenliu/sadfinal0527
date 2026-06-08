// module_c.js - 台鐵車票服務模組 (Module C)

// 模擬車站距離資料 (以花蓮為中心)
const stationDistances = {
    "和平車站": -40.0,
    "和仁車站": -32.0,
    "崇德車站": -22.0,
    "新城車站": -17.2,
    "北埔車站": -7.1,
    "花蓮車站": 0,
    "吉安車站": 3.4,
    "志學車站": 14.3,
    "壽豐車站": 17.6,
    "豐田車站": 20.3,
    "林榮新光車站": 25.8,
    "南平車站": 30.5,
    "鳳林車站": 34.8,
    "萬榮車站": 39.5,
    "光復車站": 45.1,
    "大富車站": 53.4,
    "富源車站": 56.4,
    "瑞穗車站": 65.5,
    "三民車站": 74.8,
    "玉里車站": 85.4,
    "東里車站": 91.6,
    "東竹車站": 97.4,
    "富里車站": 104.2
};

function getDistance(stationA, stationB) {
    if (!stationDistances[stationA] || !stationDistances[stationB]) return 50; // 預設50公里
    return Math.abs(stationDistances[stationA] - stationDistances[stationB]);
}

// 模擬列車時刻表資料
const mockSchedules = [
    { trainNo: "417", type: "自強(3000)", depTime: "09:00", arrTime: "10:15", duration: "75", baseRate: 3.0, status: "準時", seats: { standard: 40, business: 15, unreserved: 0, accessible: 2 } },
    { trainNo: "401", type: "普悠瑪", depTime: "10:30", arrTime: "11:40", duration: "70", baseRate: 3.0, status: "延誤5分", seats: { standard: 10, business: 0, unreserved: 0, accessible: 1 } },
    { trainNo: "4621", type: "區間車", depTime: "11:00", arrTime: "12:50", duration: "110", baseRate: 1.8, status: "準時", seats: { standard: 0, business: 0, unreserved: 120, accessible: 5 } },
    { trainNo: "4033", type: "區間快", depTime: "14:00", arrTime: "15:20", duration: "80", baseRate: 2.3, status: "準時", seats: { standard: 0, business: 0, unreserved: 80, accessible: 4 } },
    { trainNo: "423", type: "自強", depTime: "15:30", arrTime: "16:50", duration: "80", baseRate: 2.8, status: "已過站", seats: { standard: 0, business: 0, unreserved: 0, accessible: 0 } }
];

// 儲存的訂單
let trainOrders = [];

function getUserPrefix() {
    return (typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email + '_' : 'default_';
}

function loadTrainDataForUser() {
    let prefix = getUserPrefix();
    let loadedOrders = localStorage.getItem(prefix + 'agenttt_train_orders');
    if(loadedOrders) {
        try { 
            trainOrders = JSON.parse(loadedOrders); 
            // 補丁：動態修補可能已存在 localStorage 且缺少 tickets 欄位的歷史預設訂單
            trainOrders.forEach(o => {
                if (o.id === "TORD2024060102") {
                    if (!o.tickets) {
                        o.tickets = { general: 1, student: 0, elder: 0, charity: 0, child: 0 };
                    }
                    if (!o.ticketFares) {
                        o.ticketFares = { general: 440, student: 387, elder: 264, charity: 264, child: 308 };
                    }
                    if (!o.carType) {
                        o.carType = "standard";
                    }
                    if (o.passengers && o.passengers[0] && o.passengers[0].ticketType === "全票") {
                        o.passengers[0].ticketType = "一般票";
                    }
                }
            });
        } catch(e) { trainOrders = []; }
    } else {
        if (prefix === 'user@student.ncnu.edu.tw_') {
            trainOrders = [
                {
                    id: "TORD2024060102",
                    date: "2024-06-15",
                    trainNo: "228",
                    trainType: "自強",
                    origin: "台北車站",
                    dest: "花蓮車站",
                    depTime: "13:00",
                    arrTime: "15:10",
                    duration: "130",
                    passengers: [
                        { name: "預設測試帳號", phone: "0912345678", idNum: "A123456789", ticketType: "一般票" }
                    ],
                    totalAmount: 440,
                    status: "已付款",
                    email: "user@student.ncnu.edu.tw",
                    carType: "standard",
                    tickets: { general: 1, student: 0, elder: 0, charity: 0, child: 0 },
                    ticketFares: { general: 440, student: 387, elder: 264, charity: 264, child: 308 }
                }
            ];
            localStorage.setItem(prefix + 'agenttt_train_orders', JSON.stringify(trainOrders));
        } else {
            trainOrders = [];
        }
    }
    
    trainPoints = parseInt(localStorage.getItem(prefix + 'agenttt_train_points') || (prefix === 'user@student.ncnu.edu.tw_' ? "10" : "0"));
    completedBookings = parseInt(localStorage.getItem(prefix + 'agenttt_completed_bookings') || (prefix === 'user@student.ncnu.edu.tw_' ? "1" : "0"));
}

function saveTrainOrders() {
    let prefix = getUserPrefix();
    localStorage.setItem(prefix + 'agenttt_train_orders', JSON.stringify(trainOrders));
}

// 輔助本地日期時間解析函數，避免不同JS環境中 parsed as UTC / 時區偏移問題
function parseLocalJSDate(dateStr, timeStr) {
    if (!dateStr) return new Date();
    let dParts = dateStr.split('-');
    let year = parseInt(dParts[0], 10);
    let month = parseInt(dParts[1], 10) - 1; // 0-indexed
    let day = parseInt(dParts[2], 10);
    
    let hour = 0, minute = 0, second = 0;
    if (timeStr) {
        let tParts = timeStr.split(':');
        hour = parseInt(tParts[0], 10) || 0;
        minute = parseInt(tParts[1], 10) || 0;
        second = parseInt(tParts[2], 10) || 0;
    }
    return new Date(year, month, day, hour, minute, second);
}

// 計算午夜對齊的日曆天數差
function getCalendarDaysDiff(departureDate, nowDate) {
    let d1 = new Date(departureDate.getFullYear(), departureDate.getMonth(), departureDate.getDate());
    let d2 = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    let diffMs = d1 - d2;
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// 票價計算引擎
function calculateTrainFare(distance, baseRate, carType, ticketType, hoursToDep) {
    let carRate = (carType === "business") ? 1.5 : 1.0;
    let baseFare = Math.ceil(distance * baseRate * carRate); // 基本票價 = 列車基本費率 × 里程 × 車廂費率
    
    // 時間折扣 (僅對號列車，基本費率 > 2.3 元/公里)
    let timeDiscount = 1.0;
    if (baseRate > 2.3) {
        if (hoursToDep >= 24 && hoursToDep <= 72) timeDiscount = 0.95; // 1-3天內
        else if (hoursToDep >= 12 && hoursToDep < 24) timeDiscount = 0.88; // 12-24小時
        else if (hoursToDep >= 6 && hoursToDep < 12) timeDiscount = 0.85; // 6-12小時
    }
    
    let ticketDiscount = 1.0;
    if (ticketType === "學生票") ticketDiscount = 0.88;
    else if (ticketType === "敬老票" || ticketType === "愛心票") ticketDiscount = 0.60;
    else if (ticketType === "兒童票") ticketDiscount = 0.70;
    
    // 折扣衝突處理: 同一張車票只能套一種折扣，若符合多項則自動套用最優惠者 (即折扣率數值最小者)
    let finalDiscount = Math.min(timeDiscount, ticketDiscount);
    let finalFare = Math.ceil(baseFare * finalDiscount); // 最終票價 = 基本票價 × 最優惠單一折扣率
    return finalFare;
}

function searchTrains(startIdx, endIdx, date, timeStr, transferFilter, carTypeFilter) {
    // 這裡實作篩選邏輯，假設 mockSchedules 都是符合路線的
    return mockSchedules.filter(train => {
        // 簡易過濾：若選擇直達車且此處無直達，此處以假資料全部顯示為直達
        // 若有車廂偏好，確認是否還有該車廂座位
        if (carTypeFilter && carTypeFilter !== "all") {
            if (train.seats[carTypeFilter] === 0) return false;
        }
        return true;
    }).map(train => {
        return {
            ...train,
            origin: startIdx,
            dest: endIdx,
            date: date
        };
    });
}

function createTrainOrder(orderData) {
    orderData.id = "TR" + Date.now();
    orderData.status = "待付款";
    orderData.createdAt = new Date().toISOString();
    trainOrders.push(orderData);
    saveTrainOrders();
    return orderData.id;
}

function payTrainOrder(orderId) {
    let order = trainOrders.find(o => o.id === orderId);
    if(order) {
        // Only marks as paid directly for credit card or legacy calls
        order.status = "已付款";
        saveTrainOrders();
        return true;
    }
    return false;
}

function refundTrainOrder(orderId, fee, refundAmount) {
    let order = trainOrders.find(o => o.id === orderId);
    if(!order) return "找不到訂單";
    
    if (fee === undefined) {
        // 自行計算，相容其他地方呼叫
        let now = new Date();
        let depDate = parseLocalJSDate(order.date, order.depTime);
        let diffDays = getCalendarDaysDiff(depDate, now);
        
        let feeRatio = 0.10;
        if (diffDays >= 25) feeRatio = 0.01;
        else if (diffDays >= 3 && diffDays < 25) feeRatio = 0.03;
        else if (diffDays >= 1 && diffDays < 3) feeRatio = 0.05;
        
        fee = Math.ceil(order.totalAmount * feeRatio);
        refundAmount = order.totalAmount - fee;
    }
    
    order.status = "已退票";
    order.refundFee = fee;
    order.refundAmt = refundAmount;
    saveTrainOrders();
    
    // 自動刪除對應的行程記帳項目與時間軸項目
    let removedCount = 0;
    if (typeof allTripsArray !== 'undefined' && allTripsArray) {
        allTripsArray.forEach(trip => {
            // 1. 刪除記帳
            if (trip.expenses) {
                let originalLength = trip.expenses.length;
                trip.expenses = trip.expenses.filter(e => e.orderId != orderId);
                if (trip.expenses.length < originalLength) {
                    removedCount += (originalLength - trip.expenses.length);
                }
            }
            // 2. 刪除時間軸班次項目
            if (trip.timelineData) {
                Object.keys(trip.timelineData).forEach(dayKey => {
                    let dayArr = trip.timelineData[dayKey];
                    if (Array.isArray(dayArr)) {
                        let originalLength = dayArr.length;
                        trip.timelineData[dayKey] = dayArr.filter(s => s.orderId != orderId);
                        if (trip.timelineData[dayKey].length < originalLength) {
                            removedCount += (originalLength - trip.timelineData[dayKey].length);
                        }
                    }
                });
            }
        });
        if (removedCount > 0) {
            if (typeof saveTripsData === 'function') {
                saveTripsData();
            }
            if (typeof selectedTripContextObj !== 'undefined' && selectedTripContextObj) {
                let currentTrip = allTripsArray.find(t => t.id === selectedTripContextObj.id);
                if (currentTrip) {
                    selectedTripContextObj = currentTrip;
                    if (typeof renderFinancePanel === 'function') renderFinancePanel();
                    if (typeof renderDetailedItineraryTimeline === 'function') renderDetailedItineraryTimeline();
                }
            }
        }
    }
    
    return `退款成功！已退回原付款管道。扣除手續費 $${fee}，退還 $${refundAmount}。`;
}

function changeTrainOrder(orderId, newTrainInfo) {
    let order = trainOrders.find(o => o.id === orderId);
    if(!order) return "找不到訂單";
    if(order.isChanged) return "本訂單已改票，無法再次修改";
    
    order.trainNo = newTrainInfo.trainNo;
    order.depTime = newTrainInfo.depTime;
    order.arrTime = newTrainInfo.arrTime;
    order.isChanged = true;
    saveTrainOrders();
    return "改票成功！";
}

async function splitTrainOrder(orderId, targetEmail) {
    let order = trainOrders.find(o => o.id === orderId);
    if(!order) return "找不到訂單";
    if(order.status !== "已付款") return "僅已付款訂單可分票";
    let method = order.retrievalMethod || "電子票";
    if(method !== "電子票" && method !== "線上取票") return "僅限電子票或線上取票票券可分票";
    
    // Validate target user from database.json
    let validUser = false;
    try {
        let res = await fetch('./database.json');
        if(res.ok) {
            let db = await res.json();
            if(db.users && db.users.find(u => u.email === targetEmail)) validUser = true;
            // Also allow collaborators/creators for robust testing
            if(db.trips && db.trips.some(t => t.creatorEmail === targetEmail || (t.collaborators && t.collaborators.includes(targetEmail)))) validUser = true;
        }
    } catch(e) {}
    
    // Fallback for testing
    if(targetEmail === "user@student.ncnu.edu.tw" || targetEmail === "cheng@gmail.com" || targetEmail.includes("@test.com")) validUser = true;
    
    if(!validUser) {
        return "分票失敗：找不到該平台的註冊會員帳號，請輸入正確的平臺註冊 Email！";
    }
    
    order.sharedWith = targetEmail;
    
    // 模擬發送給對方：產生一張專屬的接收車票
    let receivedOrder = JSON.parse(JSON.stringify(order));
    receivedOrder.id = "SH" + Date.now();
    receivedOrder.status = "有效票 (來自他人分票)";
    receivedOrder.isReceived = true;
    receivedOrder.ownerEmail = targetEmail;
    
    let senderEmail = (typeof currentUser !== 'undefined' && currentUser && currentUser.email) ? currentUser.email : "我";
    receivedOrder.sharedFrom = senderEmail;
    
    // 寫入到接收者的訂單資料庫中
    let targetPrefix = targetEmail + '_';
    let targetOrders = [];
    let loadedTargetOrders = localStorage.getItem(targetPrefix + 'agenttt_train_orders');
    if (loadedTargetOrders) {
        try { targetOrders = JSON.parse(loadedTargetOrders); } catch(e) {}
    }
    targetOrders.push(receivedOrder);
    localStorage.setItem(targetPrefix + 'agenttt_train_orders', JSON.stringify(targetOrders));
    
    // 儲存發送者的訂單資料 (標記 sharedWith)
    saveTrainOrders();
    
    return `✅ 系統已成功驗證會員 ${targetEmail} 的身分！\n已將車票分發，並以邀請形式顯示於對方的「我的車票」頁面中。`;
}

// 模擬補償與點數系統
let trainPoints = 0;
let completedBookings = 0;

// 初次加載 (若此時currentUser未就緒，後續會在開啟modal時重新載入)
loadTrainDataForUser();

function savePointsAndBookings() {
    let prefix = getUserPrefix();
    localStorage.setItem(prefix + 'agenttt_train_points', trainPoints);
    localStorage.setItem(prefix + 'agenttt_completed_bookings', completedBookings);
}

async function checkTrainDelayCompensate(order) {
    if (!order) return;
    let train = mockSchedules.find(t => t.trainNo === order.trainNo);
    if (train && train.status && train.status.includes("延誤")) {
        trainPoints += 30;
        savePointsAndBookings();
        await platformAlert(`⚠️ 通知：您預訂的車次 ${order.trainNo} (${train.status}) 發生延誤，平台已發送 30 點作為延誤補償！(1點 = 1元)`, "warning");
    }
}

console.log("Module C - Train Ticket Service Loaded");

// --- UI Interaction Functions ---

let currentSelectedTrain = null;
let passengerVerifications = []; // 乘客證件驗證狀態暫存陣列

async function renderTrainResults() {
    let origin = document.getElementById("trainSearchOrigin").value;
    let dest = document.getElementById("trainSearchDest").value;
    let date = document.getElementById("trainSearchDate").value;
    let timeFilter = document.getElementById("trainSearchTime").value;
    let transferFilter = document.getElementById("trainSearchTransfer").value;
    let carTypeFilter = document.getElementById("trainSearchCarType").value;
    
    if(!date) {
        await platformAlert("請選擇乘車日期！", "warning");
        return;
    }
    
    // 將進階篩選條件傳入 searchTrains 或在前端處理
    let results = searchTrains(origin, dest, date, timeFilter, transferFilter, carTypeFilter);
    let container = document.getElementById("trainResultsContainer");
    
    if(results.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">無符合條件之列車</div>`;
        return;
    }
    
    let dist = getDistance(origin, dest);
    
    let html = `<table class="data-table">
        <thead>
            <tr><th>行駛日期</th><th>車次</th><th>出發 - 到達</th><th>行車時間</th><th>狀態</th><th>剩餘座位</th><th>操作</th></tr>
        </thead>
        <tbody>`;
        
    results.forEach((t, index) => {
        let seatStr = `標準:${t.seats.standard} 商務:${t.seats.business} 自由座:${t.seats.unreserved}`;
        let statusBadge = (t.status === "準時") ? `<span style="color:green;">準時</span>` : `<span style="color:red;">${t.status}</span>`;
        html += `<tr>
            <td>${t.date}</td>
            <td>
                <strong>${t.type}</strong> <br>
                <a href="javascript:void(0)" onclick="showTrainSchedule('${t.trainNo}', '${origin}', '${dest}')" style="color:var(--primary-earth); font-weight:bold; text-decoration:underline; cursor:pointer;">${t.trainNo}</a>
            </td>
            <td>${t.depTime} - ${t.arrTime}</td>
            <td>${t.duration} 分鐘</td>
            <td>${statusBadge}</td>
            <td style="font-size:11px; color:var(--text-muted);">${seatStr}</td>
            <td>
                <button class="btn btn-sm btn-accent" onclick="openTrainBookingModal('${t.trainNo}', '${origin}', '${dest}', '${date}', ${dist})">訂票</button>
            </td>
        </tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

async function openTrainBookingModal(trainNo, origin, dest, date, distance) {
    loadTrainDataForUser(); // 確保讀取到當前帳號的資料
    let train = mockSchedules.find(t => t.trainNo === trainNo);
    if(train.status === "已過站") {
        await platformAlert("該列車已過站，無法訂票。", "error");
        return;
    }
    
    currentSelectedTrain = {
        ...train,
        origin: origin,
        dest: dest,
        date: date,
        distance: distance
    };
    
    passengerVerifications = []; // 重設驗證狀態暫存
    
    document.getElementById("bookingTrainInfo").innerHTML = `
        ${date} | ${origin} <i class="fa-solid fa-arrow-right"></i> ${dest} <br>
        ${train.type} (${train.trainNo}) | ${train.depTime} - ${train.arrTime}
    `;
    
    document.getElementById("ticketQty_general").value = 1;
    document.getElementById("ticketQty_student").value = 0;
    document.getElementById("ticketQty_elder").value = 0;
    document.getElementById("ticketQty_charity").value = 0;
    document.getElementById("ticketQty_child").value = 0;
    
    rebuildPassengerFields();
    updateBookingTotal();
    document.getElementById("trainBookingModal").style.display = "flex";
}

function rebuildPassengerFields() {
    let qGen = parseInt(document.getElementById("ticketQty_general").value) || 0;
    let qStu = parseInt(document.getElementById("ticketQty_student").value) || 0;
    let qEld = parseInt(document.getElementById("ticketQty_elder").value) || 0;
    let qCha = parseInt(document.getElementById("ticketQty_charity").value) || 0;
    let qChi = parseInt(document.getElementById("ticketQty_child").value) || 0;
    let totalQty = qGen + qStu + qEld + qCha + qChi;
    
    let container = document.getElementById("bookingPassengersContainer");
    if (!container) return;
    
    // Save current input values to prevent losing them when changing count
    let currentInputs = [];
    let rows = container.querySelectorAll(".passenger-row");
    rows.forEach(row => {
        currentInputs.push({
            name: row.querySelector(".p-name").value,
            phone: row.querySelector(".p-phone").value,
            idNum: row.querySelector(".p-id").value,
            type: row.querySelector(".p-type").value
        });
    });
    
    // Determine the expected ticket types sequence
    let expectedTypes = [];
    for(let i=0; i<qGen; i++) expectedTypes.push("一般票");
    for(let i=0; i<qStu; i++) expectedTypes.push("學生票");
    for(let i=0; i<qEld; i++) expectedTypes.push("敬老票");
    for(let i=0; i<qCha; i++) expectedTypes.push("愛心票");
    for(let i=0; i<qChi; i++) expectedTypes.push("兒童票");
    
    let html = `<label style="font-weight:bold; color:var(--primary-earth); margin-bottom:10px; display:block;">乘客詳細資料 (共 ${totalQty} 人)</label>`;
    
    for (let i = 0; i < totalQty; i++) {
        let defaultType = expectedTypes[i] || "一般票";
        let valName = (currentInputs[i] && currentInputs[i].name) || "";
        let valPhone = (currentInputs[i] && currentInputs[i].phone) || "";
        let valId = (currentInputs[i] && currentInputs[i].idNum) || "";
        let valType = (currentInputs[i] && currentInputs[i].type) || defaultType;
        
        // 初始化或比對重設該位置的驗證狀態
        if (!passengerVerifications[i]) {
            passengerVerifications[i] = { verified: false };
        }
        // 如果該位置以前驗證過，但現在票種與當時驗證票種不符，則重設為未驗證
        if (passengerVerifications[i].verified && passengerVerifications[i].ticketType !== valType) {
            passengerVerifications[i] = { verified: false };
        }
        
        // 生成驗證狀態區塊 HTML
        let verifyBoxHtml = "";
        if (valType === "學生票" || valType === "敬老票" || valType === "愛心票") {
            let vState = passengerVerifications[i];
            if (vState.verified) {
                verifyBoxHtml = `
                <div class="verification-status-box" style="margin-top: 8px; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; background: #EAF2EC; border: 1px solid #C3E6CB;">
                    <span style="font-size: 11px; color: var(--primary-earth); font-weight: bold; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-circle-check" style="font-size: 13px;"></i> 已驗證: ${vState.summary}
                    </span>
                    <button class="btn btn-sm btn-outline" style="padding: 2px 8px; font-size: 10px; background: white;" onclick="openProofVerificationModal(${i}, '${valType}')">
                        <i class="fa-solid fa-arrows-rotate"></i> 重新驗證
                    </button>
                </div>
                `;
            } else {
                verifyBoxHtml = `
                <div class="verification-status-box" style="margin-top: 8px; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; background: #FFF5F5; border: 1px solid #FFD1D1;">
                    <span style="font-size: 11px; color: var(--danger-color); font-weight: bold; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 13px;"></i> 需驗證證明文件 (未驗證)
                    </span>
                    <button class="btn btn-sm btn-accent" style="padding: 2px 6px; font-size: 10px; border-radius: 4px;" onclick="openProofVerificationModal(${i}, '${valType}')">
                        <i class="fa-solid fa-id-card"></i> 驗證證明
                    </button>
                </div>
                `;
            }
        } else {
            verifyBoxHtml = `
            <div class="verification-status-box" style="margin-top: 8px; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; background: #F0EFEA; border: 1px solid #E1DFD7; font-size: 11px; color: var(--text-muted);">
                <i class="fa-solid fa-circle-info" style="margin-right: 4px;"></i> 此票種無須驗證證明文件
            </div>
            `;
        }
        
        html += `
        <div class="passenger-row" style="background:#FAF9F6; border:1px solid var(--border-color); padding:10px; border-radius:6px; margin-bottom:10px;">
            <div style="font-size:12px; font-weight:bold; color:var(--text-muted); margin-bottom:6px; display:flex; justify-content:space-between;">
                <span>乘客 ${i + 1}</span>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:6px;">
                <div>
                    <label style="font-size:11px; color:#555;">姓名</label>
                    <input type="text" class="form-control p-name" style="padding:4px;" placeholder="姓名" value="${valName}">
                </div>
                <div>
                    <label style="font-size:11px; color:#555;">電話</label>
                    <input type="text" class="form-control p-phone" style="padding:4px;" placeholder="電話號碼" value="${valPhone}">
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1.2fr 0.8fr; gap:8px; margin-bottom:8px;">
                <div>
                    <label style="font-size:11px; color:#555;">身分證字號</label>
                    <input type="text" class="form-control p-id" style="padding:4px;" placeholder="身分證字號" value="${valId}">
                </div>
                <div>
                    <label style="font-size:11px; color:#555;">票種</label>
                    <select class="form-control p-type" style="padding:4px;" onchange="syncPassengerTypesToQty()">
                        <option value="一般票" ${valType==="一般票"?"selected":""}>一般票</option>
                        <option value="學生票" ${valType==="學生票"?"selected":""}>學生票</option>
                        <option value="敬老票" ${valType==="敬老票"?"selected":""}>敬老票</option>
                        <option value="愛心票" ${valType==="愛心票"?"selected":""}>愛心票</option>
                        <option value="兒童票" ${valType==="兒童票"?"selected":""}>兒童票</option>
                    </select>
                </div>
            </div>
            ${verifyBoxHtml}
        </div>
        `;
    }
    
    container.innerHTML = html;
}

function syncPassengerTypesToQty() {
    let container = document.getElementById("bookingPassengersContainer");
    if(!container) return;
    let rows = container.querySelectorAll(".passenger-row");
    
    let qGen = 0, qStu = 0, qEld = 0, qCha = 0, qChi = 0;
    rows.forEach(row => {
        let type = row.querySelector(".p-type").value;
        if(type === "一般票") qGen++;
        else if(type === "學生票") qStu++;
        else if(type === "敬老票") qEld++;
        else if(type === "愛心票") qCha++;
        else if(type === "兒童票") qChi++;
    });
    
    document.getElementById("ticketQty_general").value = qGen;
    document.getElementById("ticketQty_student").value = qStu;
    document.getElementById("ticketQty_elder").value = qEld;
    document.getElementById("ticketQty_charity").value = qCha;
    document.getElementById("ticketQty_child").value = qChi;
    
    rebuildPassengerFields(); // 重新編排以更新驗證欄位顯示
    updateBookingTotal();
}


function onQtyChange() {
    let qGen = parseInt(document.getElementById("ticketQty_general").value) || 0;
    let qStu = parseInt(document.getElementById("ticketQty_student").value) || 0;
    let qEld = parseInt(document.getElementById("ticketQty_elder").value) || 0;
    let qCha = parseInt(document.getElementById("ticketQty_charity").value) || 0;
    let qChi = parseInt(document.getElementById("ticketQty_child").value) || 0;
    let totalQty = qGen + qStu + qEld + qCha + qChi;
    
    if(totalQty > 6) {
        platformAlert("單筆訂單最多僅能購買 6 張車票！", "warning");
        syncPassengerTypesToQty();
        return;
    }
    
    rebuildPassengerFields();
    updateBookingTotal();
}

function calculateHoursToDep() {
    if (!currentSelectedTrain) return 20;
    let now = new Date();
    let depDate = parseLocalJSDate(currentSelectedTrain.date, currentSelectedTrain.depTime);
    let diffMs = depDate - now;
    let hours = diffMs / (1000 * 60 * 60);
    return hours < 0 ? 0 : hours;
}

function updateBookingTotal() {
    if(!currentSelectedTrain) return;
    
    let qGen = parseInt(document.getElementById("ticketQty_general").value) || 0;
    let qStu = parseInt(document.getElementById("ticketQty_student").value) || 0;
    let qEld = parseInt(document.getElementById("ticketQty_elder").value) || 0;
    let qCha = parseInt(document.getElementById("ticketQty_charity").value) || 0;
    let qChi = parseInt(document.getElementById("ticketQty_child").value) || 0;
    
    let totalQty = qGen + qStu + qEld + qCha + qChi;
    if(totalQty > 6) {
        platformAlert("單筆訂單最多僅能購買 6 張車票！", "warning");
        return;
    }
    
    let carType = document.getElementById("bookingCarType").value;
    let baseRate = currentSelectedTrain.baseRate;
    let dist = currentSelectedTrain.distance;
    
    // 自動核算距離發車的剩餘小時與時間折扣
    let hoursToDep = calculateHoursToDep();
    
    // 更新 UI 文字
    let now = new Date();
    let depDate = parseLocalJSDate(currentSelectedTrain.date, currentSelectedTrain.depTime);
    
    let currentTextSpan = document.getElementById("bookingCurrentTimeText");
    if (currentTextSpan) {
        currentTextSpan.innerText = now.toLocaleString('zh-TW', { hour12: false });
    }
    let trainTextSpan = document.getElementById("bookingTrainTimeText");
    if (trainTextSpan) {
        trainTextSpan.innerText = depDate.toLocaleString('zh-TW', { hour12: false });
    }
    let hoursTextSpan = document.getElementById("bookingHoursToDepText");
    if (hoursTextSpan) {
        if (hoursToDep >= 24) {
            let days = Math.floor(hoursToDep / 24);
            let remHours = Math.round(hoursToDep % 24);
            hoursTextSpan.innerText = `${days} 天 ${remHours} 小時`;
        } else {
            hoursTextSpan.innerText = `${hoursToDep.toFixed(1)} 小時`;
        }
    }
    
    let fareGen = calculateTrainFare(dist, baseRate, carType, "一般票", hoursToDep);
    let fareStu = calculateTrainFare(dist, baseRate, carType, "學生票", hoursToDep);
    let fareEld = calculateTrainFare(dist, baseRate, carType, "敬老票", hoursToDep);
    let fareCha = calculateTrainFare(dist, baseRate, carType, "愛心票", hoursToDep);
    let fareChi = calculateTrainFare(dist, baseRate, carType, "兒童票", hoursToDep);
    
    let totalAmount = (qGen * fareGen) + (qStu * fareStu) + (qEld * fareEld) + (qCha * fareCha) + (qChi * fareChi);
    
    let discountMsg = "";
    if (baseRate > 2.3) {
        let discPct = "100%";
        if (hoursToDep >= 24 && hoursToDep <= 72) discPct = "95%";
        else if (hoursToDep >= 12 && hoursToDep < 24) discPct = "88%";
        else if (hoursToDep >= 6 && hoursToDep < 12) discPct = "85%";
        else if (hoursToDep < 6) discPct = "無時間折扣";
        discountMsg = `此對號列車已套用發車前時間折扣（目前為：${discPct}）。依據折扣衝突處理規則：同一張車票只能套一種折扣，若符合多項則自動套用最優惠者。`;
    }
    
    let previewHtml = `<div style="font-weight:bold; margin-bottom:8px; color:var(--primary-earth);">訂單明細預覽</div>`;
    
    let baseFareVal = Math.ceil(dist * baseRate * (carType === "business" ? 1.5 : 1.0));
    
    function formatFareLine(label, qty, finalFare) {
        if(qty <= 0) return "";
        let baseTotal = qty * baseFareVal;
        let finalTotal = qty * finalFare;
        let fareDisplay = (baseTotal > finalTotal) ? 
            `<span style="text-decoration:line-through; color:#aaa; margin-right:5px;">$${baseTotal}</span><span style="color:var(--danger-color); font-weight:bold;">$${finalTotal}</span>` : 
            `<span>$${finalTotal}</span>`;
        return `<div style="display:flex; justify-content:space-between; margin-bottom:3px;"><span>${label} x ${qty}</span><div>${fareDisplay}</div></div>`;
    }

    previewHtml += formatFareLine("一般票", qGen, fareGen);
    previewHtml += formatFareLine("學生票", qStu, fareStu);
    previewHtml += formatFareLine("敬老票", qEld, fareEld);
    previewHtml += formatFareLine("愛心票", qCha, fareCha);
    previewHtml += formatFareLine("兒童票", qChi, fareChi);
    
    let previewContainer = document.getElementById("bookingOrderPreview");
    if(totalQty > 0) {
        previewContainer.innerHTML = previewHtml;
        previewContainer.style.display = "block";
    } else {
        previewContainer.style.display = "none";
    }

    document.getElementById("bookingTimeDiscountNote").innerText = discountMsg;
    document.getElementById("bookingTotalAmount").innerText = "$" + totalAmount;
    
    return totalAmount;
}

async function submitTrainBooking() {
    let invoiceEmail = document.getElementById("bookingInvoiceEmail").value.trim();
    let retrievalMethod = document.getElementById("bookingRetrievalMethod") ? document.getElementById("bookingRetrievalMethod").value : "電子票";
    
    let qGen = parseInt(document.getElementById("ticketQty_general").value) || 0;
    let qStu = parseInt(document.getElementById("ticketQty_student").value) || 0;
    let qEld = parseInt(document.getElementById("ticketQty_elder").value) || 0;
    let qCha = parseInt(document.getElementById("ticketQty_charity").value) || 0;
    let qChi = parseInt(document.getElementById("ticketQty_child").value) || 0;
    
    let totalQty = qGen + qStu + qEld + qCha + qChi;
    if(totalQty === 0) {
        await platformAlert("請至少選擇一張車票", "warning");
        return;
    }
    
    let container = document.getElementById("bookingPassengersContainer");
    let rows = container.querySelectorAll(".passenger-row");
    let passengers = [];
    let isValid = true;
    
    for (let i = 0; i < rows.length; i++) {
        let pName = rows[i].querySelector(".p-name").value.trim();
        let pPhone = rows[i].querySelector(".p-phone").value.trim();
        let pId = rows[i].querySelector(".p-id").value.trim();
        let pType = rows[i].querySelector(".p-type").value;
        
        if (!pName || !pPhone || !pId) {
            await platformAlert(`請填寫乘客 ${i + 1} 的姓名、電話與身分證字號！`, "warning");
            isValid = false;
            break;
        }
        if (pId.length !== 10) {
            await platformAlert(`乘客 ${i + 1} 的身分證字號格式不正確 (應為 10 碼)！`, "error");
            isValid = false;
            break;
        }
        
        if (pType === "學生票" || pType === "敬老票" || pType === "愛心票") {
            let vState = passengerVerifications[i];
            if (!vState || !vState.verified) {
                await platformAlert(`請先完成乘客 ${i + 1} (${pName}) 的特殊票種證明驗證！`, "warning");
                isValid = false;
                break;
            }
            passengers.push({ 
                name: pName, 
                phone: pPhone, 
                idNum: pId, 
                ticketType: pType,
                verified: true,
                verificationSummary: vState.summary 
            });
        } else {
            passengers.push({ name: pName, phone: pPhone, idNum: pId, ticketType: pType });
        }
    }
    
    if (!isValid) return;
    
    if(!invoiceEmail || !invoiceEmail.includes("@")) {
        await platformAlert("請提供有效的 Email 以接收電子發票", "warning");
        return;
    }
    
    let amount = updateBookingTotal();
    
    // 計算單價以便在「我的車票」顯示小計
    let dist = currentSelectedTrain.distance;
    let baseRate = currentSelectedTrain.baseRate;
    let carType = document.getElementById("bookingCarType") ? document.getElementById("bookingCarType").value : "標準車廂";
    let hoursToDep = calculateHoursToDep();
    
    let fGen = calculateTrainFare(dist, baseRate, carType, "一般票", hoursToDep);
    let fStu = calculateTrainFare(dist, baseRate, carType, "學生票", hoursToDep);
    let fEld = calculateTrainFare(dist, baseRate, carType, "敬老票", hoursToDep);
    let fCha = calculateTrainFare(dist, baseRate, carType, "愛心票", hoursToDep);
    let fChi = calculateTrainFare(dist, baseRate, carType, "兒童票", hoursToDep);
    
    let orderData = {
        trainNo: currentSelectedTrain.trainNo,
        trainType: currentSelectedTrain.type,
        origin: currentSelectedTrain.origin,
        dest: currentSelectedTrain.dest,
        date: currentSelectedTrain.date,
        depTime: currentSelectedTrain.depTime,
        arrTime: currentSelectedTrain.arrTime,
        passengerName: passengers[0].name,
        passengerID: passengers[0].idNum,
        passengers: passengers,
        invoiceEmail: invoiceEmail,
        totalAmount: amount,
        retrievalMethod: retrievalMethod,
        carType: carType,
        tickets: { general: qGen, student: qStu, elder: qEld, charity: qCha, child: qChi },
        ticketFares: { general: fGen, student: fStu, elder: fEld, charity: fCha, child: fChi }
    };
    
    let orderId = createTrainOrder(orderData);
    document.getElementById("trainBookingModal").style.display = "none";
    
    // 開啟專屬付款畫面
    openTrainPaymentModal(orderId, amount);
}

function populateTrainOrdersList() {
    loadTrainDataForUser(); // 切換帳號後重新載入屬於該帳號的訂單
    let container = document.getElementById("myTrainOrdersList") || document.getElementById("trainOrderListContainer");
    if(!container) return;
    
    if(trainOrders.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px;">尚無訂單紀錄</div>`;
    } else {
        let html = "";
        trainOrders.slice().reverse().forEach(o => {
            let statusColor = (o.status.includes("有效") || o.status === "已付款") ? "green" : (o.status === "已退票" ? "red" : "orange");
            
            // 如果是模擬接收到的分票，外觀給予不同樣式 (模擬對方視角)
            let isReceived = o.isReceived;
            let bgColor = isReceived ? "#F0F7FF" : "#fff";
            let borderStyle = isReceived ? "border:2px solid #AECDF2;" : "border:1px solid var(--border-color);";
            
            html += `<div style="${borderStyle} border-radius:8px; padding:15px; margin-bottom:10px; background:${bgColor};">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <strong>${isReceived ? `<i class="fa-solid fa-envelope-open-text" style="color:#0056b3;"></i> [收到分票邀請]` : "訂單編號：" + o.id}</strong>
                    <span style="color:${statusColor}; font-weight:bold;">${o.status}</span>
                </div>
                <div style="font-size:14px; margin-bottom:10px;">
                    ${o.date} | ${o.trainType} (${o.trainNo}) | ${o.origin} <i class="fa-solid fa-arrow-right"></i> ${o.dest} <br>
                    時間：${o.depTime} - ${o.arrTime} <br>
                    ${o.passengers && o.passengers.length > 0 ? 
                        o.passengers.map((p, pIdx) => {
                            let verifyText = p.verificationSummary ? ` <span style="color:var(--primary-earth); font-weight:bold;"><i class="fa-solid fa-circle-check"></i> ${p.verificationSummary}</span>` : "";
                            return `乘客 ${pIdx + 1}：${p.name} (${p.ticketType}) | 電話: ${p.phone} | (${p.idNum.substring(0,4)}******)${verifyText}`;
                        }).join('<br> ') 
                        : `乘客：${o.passengerName} (${o.passengerID.substring(0,4)}******)`
                    } <br>
                    取票方式：<span style="color:var(--primary-earth); font-weight:bold;">${o.retrievalMethod || "電子票"}</span>
                    ${o.sharedWith ? `<br><span style="color:#0056b3; font-weight:bold;"><i class="fa-solid fa-paper-plane"></i> 已分票給帳號: ${o.sharedWith}</span>` : ""}
                    ${isReceived ? `<br><span style="color:#0056b3; font-weight:bold;"><i class="fa-solid fa-gift"></i> 此票券由 ${o.sharedFrom} 分發給您</span>` : ""}
                </div>`;
                
            // === 加入票種明細與小計 ===
            if (!isReceived) {
                html += `<div style="background:#f8f9fa; border:1px solid #eee; padding:10px; border-radius:6px; margin-bottom:10px; font-size:13px;">`;
                html += `<div style="font-weight:bold; margin-bottom:5px; color:var(--primary-earth);">票種明細與小計</div>`;
                
                let fg = (o.ticketFares && o.ticketFares.general);
                let fs = (o.ticketFares && o.ticketFares.student);
                let fe = (o.ticketFares && o.ticketFares.elder);
                let fch = (o.ticketFares && o.ticketFares.charity);
                let fc = (o.ticketFares && o.ticketFares.child);
                
                let tkts = o.tickets || { general: 1, student: 0, elder: 0, charity: 0, child: 0 };
                let carType = o.carType || "standard";
                
                // 相容舊訂單：若無票價紀錄則重新計算
                if (fg === undefined) {
                    let dist = 0;
                    if(typeof getDistance === "function") dist = getDistance(o.origin, o.dest);
                    let br = 2.9; // 預設自強號
                    if(o.trainType && o.trainType.includes("區間快")) br = 2.3;
                    else if(o.trainType && o.trainType.includes("區間")) br = 1.8;
                    
                    let orderDepDate = parseLocalJSDate(o.date, o.depTime);
                    let hoursToDep = (orderDepDate - new Date()) / (1000 * 60 * 60);
                    if (hoursToDep < 0) hoursToDep = 0;
                    
                    fg = calculateTrainFare(dist, br, carType, "一般票", hoursToDep);
                    fs = calculateTrainFare(dist, br, carType, "學生票", hoursToDep);
                    fe = calculateTrainFare(dist, br, carType, "敬老票", hoursToDep);
                    fch = calculateTrainFare(dist, br, carType, "愛心票", hoursToDep);
                    fc = calculateTrainFare(dist, br, carType, "兒童票", hoursToDep);
                }
                
                if(tkts.general > 0) html += `<div style="display:flex; justify-content:space-between;"><span>一般票 x ${tkts.general}</span><span>$${tkts.general * fg}</span></div>`;
                if(tkts.student > 0) html += `<div style="display:flex; justify-content:space-between;"><span>學生票 x ${tkts.student}</span><span>$${tkts.student * fs}</span></div>`;
                if(tkts.elder > 0) html += `<div style="display:flex; justify-content:space-between;"><span>敬老票 x ${tkts.elder}</span><span>$${tkts.elder * fe}</span></div>`;
                if(tkts.charity > 0) html += `<div style="display:flex; justify-content:space-between;"><span>愛心票 x ${tkts.charity}</span><span>$${tkts.charity * fch}</span></div>`;
                if(tkts.child > 0) html += `<div style="display:flex; justify-content:space-between;"><span>兒童票 x ${tkts.child}</span><span>$${tkts.child * fc}</span></div>`;
                html += `</div>`;
            }

            html += `<div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:bold; color:var(--danger-color);">
                        ${!isReceived ? `總金額：$${o.totalAmount}` : ""}
                        ${o.usedPoints && !isReceived ? `<br><span style="font-size:12px; color:var(--primary-earth);">(已使用 ${o.usedPoints} 點折抵，實付 $${o.finalAmount})</span>` : ""}
                    </div>
                    <div style="display:flex; gap:8px;">`;
            
            if(o.status === "待付款") {
                html += `<button class="btn btn-sm btn-primary" onclick="openTrainPaymentModal('${o.id}', ${o.totalAmount});">前往結帳</button>`;
            } else if (o.status === "待繳費") {
                let pType = o.paymentMethod === "銀行轉帳" ? "轉帳帳號" : "繳費代碼";
                html += `<div style="font-size:12px; color:var(--text-muted); background:#F2F5F3; padding:5px; border-radius:4px; margin-right:8px;">${pType}: <strong>${o.paymentCode}</strong></div>`;
                html += `<button class="btn btn-sm btn-accent" onclick="simulateCompletePayment('${o.id}')">模擬已轉帳</button>`;
            } else if (o.status === "已付款" && !isReceived) {
                if(!o.isChanged) {
                    html += `<button class="btn btn-sm btn-outline" onclick="promptChangeTicket('${o.id}')">改票</button>`;
                }
                html += `<button class="btn btn-sm btn-outline" onclick="promptSplitTicket('${o.id}')">分票</button>`;
                html += `<button class="btn btn-sm btn-danger" onclick="promptRefundTicket('${o.id}')">退票</button>`;
            } else if (isReceived) {
                html += `<button class="btn btn-sm btn-primary" onclick="platformAlert('已儲存至您的 APP 電子票夾中。')">查看 QR Code</button>`;
            }
            
            html += `</div></div></div>`;
        });
        container.innerHTML = html;
    }
}

function openMyTrainOrders() {
    populateTrainOrdersList();
    document.getElementById("myOrdersModal").style.display = "flex";
    if (typeof switchOrderTab === 'function') {
        switchOrderTab('train');
    }
}

async function promptRefundTicket(orderId) {
    let order = trainOrders.find(o => o.id === orderId);
    if (!order) {
        await platformAlert("找不到該訂單！", "error");
        return;
    }
    
    // 1. 檢查是否已使用、已退票或過期
    let now = new Date();
    let depDate = parseLocalJSDate(order.date, order.depTime);
    let diffMs = depDate - now;
    let diffDays = getCalendarDaysDiff(depDate, now);
    
    if (order.status === "已使用" || diffMs <= 0 || order.status === "已退票") {
        await platformAlert("無法退票：此訂單已使用或已超過可退票期限（列車已發車）！", "error");
        return;
    }
    
    // 2. 計算手續費比例
    let feeRatio = 0.10; // 預設當天 10%
    let rateText = "當天 (10%)";
    if (diffDays >= 25) {
        feeRatio = 0.01;
        rateText = "25天以上 (1%)";
    } else if (diffDays >= 3 && diffDays < 25) {
        feeRatio = 0.03;
        rateText = "3–24天 (3%)";
    } else if (diffDays >= 1 && diffDays < 3) {
        feeRatio = 0.05;
        rateText = "1–2天 (5%)";
    }
    
    let fee = Math.ceil(order.totalAmount * feeRatio);
    let refundAmount = order.totalAmount - fee;
    
    // 5. 乘客確認退票
    let daysText = diffDays >= 1 ? `${diffDays} 天` : `${(diffMs / (1000 * 60 * 60)).toFixed(1)} 小時`;
    let confirmMsg = `【火車票退票申請】\n\n` +
                     `列車出發時間：${order.date} ${order.depTime}\n` +
                     `距離發車時間：${daysText}\n` +
                     `退票手續費費率：${rateText}\n` +
                     `扣除手續費金額：$${fee}\n` +
                     `實退退款金額：$${refundAmount}\n\n` +
                     `您確定要辦理退票嗎？`;
    
    if (await platformConfirm(confirmMsg)) {
        // 模擬退款金流失敗之例外狀況 (隨機 10% 機率，或訂單ID含有'999')
        let mockFailure = (Math.random() < 0.1) || order.id.includes("999");
        
        if (mockFailure) {
            // 例外狀況 2: 退款失敗，系統提示錯誤並通知客服處理
            await platformAlert("【金流退款異常】\n退款至原信用卡/帳戶發生未知金流服務逾時錯誤。\n系統已自動提示此異常並立案通知平台客服介入處理，請您無須重複操作！", "error");
            return;
        }
        
        // 6. 系統執行退票並完成退款
        // 7. 系統更新狀態為「已退票」
        let res = refundTrainOrder(orderId, fee, refundAmount);
        await platformAlert(res, "success");
        openMyTrainOrders();
    }
}

async function promptChangeTicket(orderId) {
    let order = trainOrders.find(o => o.id === orderId);
    
    // 規則 1: 檢查是否已改票 (最多1次)
    if(order.isChanged) {
        await platformAlert("改票失敗：每筆訂單最多僅能辦理 1 次改票，本訂單已使用過改票額度。", "warning");
        return;
    }
    
    // 規則 2: 僅限未取票
    if(order.isCollected) {
        await platformAlert("改票失敗：本訂單已取票！依規定僅限「未取票」之訂單可於線上辦理改票。", "error");
        return;
    }
    
    // 規則 3: 發車前 1 小時辦理 (此處以模擬邏輯展示，實務上需比對 order.date 與 order.depTime)
    let isTooCloseToDeparture = false; // 模擬變數
    if(isTooCloseToDeparture) {
        await platformAlert("改票失敗：改票作業最遲須於「發車前 1 小時」辦理。", "warning");
        return;
    }

    let newTime = await platformPrompt("請輸入欲更改的乘車時間 (例如: 18:30)，我們將為您安排最近的一班車", "18:30");
    if(newTime) {
        // 規則 4: 檢查座位可用性 (以 30% 機率模擬客滿)
        if(Math.random() > 0.7) {
            await platformAlert(`很抱歉，系統檢查後發現 ${newTime} 鄰近班次的「座位可用性不足 (已客滿)」，請嘗試其他時段！`, "error");
            return;
        }
        
        let res = changeTrainOrder(orderId, { trainNo: "改票班次455", depTime: newTime, arrTime: "20:00" });
        await platformAlert(res, "success");
        openMyTrainOrders();
    }
}

async function promptSplitTicket(orderId) {
    let order = trainOrders.find(o => o.id === orderId);
    let method = order.retrievalMethod || "電子票";
    if(method !== "電子票" && method !== "線上取票") {
        await platformAlert("僅限「電子票」或「線上取票」之票券才能進行分票。", "warning");
        return;
    }
    let email = await platformPrompt("請輸入欲分票對象的註冊 Email：\n(如: user@student.ncnu.edu.tw 或 cheng@gmail.com)");
    if(email) {
        let res = await splitTrainOrder(orderId, email); // Now awaiting because it fetches json
        if(res.includes("成功")) {
            await platformAlert(res, "success");
        } else {
            await platformAlert(res, "error");
        }
        openMyTrainOrders();
    }
}

let currentPaymentOrderId = null;

function openTrainPaymentModal(orderId, amount) {
    let order = trainOrders.find(o => o.id === orderId);
    if(!order) return;
    
    currentPaymentOrderId = orderId;
    document.getElementById("paymentOrderId").innerText = orderId;
    document.getElementById("paymentTotalAmount").innerText = "$" + amount;
    
    let passengersText = "";
    if (order.passengers && order.passengers.length > 0) {
        passengersText = order.passengers.map((p, pIdx) => {
            let verifyText = p.verificationSummary ? ` <span style="color:var(--primary-earth); font-weight:bold;"><i class="fa-solid fa-circle-check"></i> ${p.verificationSummary}</span>` : "";
            return `乘客 ${pIdx + 1}: ${p.name} (${p.ticketType}) | (${p.idNum.substring(0,4)}******)${verifyText}`;
        }).join('<br> ');
    } else {
        passengersText = `乘客：${order.passengerName} (${order.passengerID.substring(0,4)}******)`;
    }
    
    // Populate Order Details
    document.getElementById("paymentOrderDetails").innerHTML = `
        <strong>${order.date}</strong> | ${order.trainType} (${order.trainNo})<br>
        ${order.origin} <i class="fa-solid fa-arrow-right"></i> ${order.dest} (${order.depTime} - ${order.arrTime})<br>
        <span style="color:var(--text-muted);">${passengersText} <br> 取票方式：${order.retrievalMethod}</span>
    `;
    
    // Populate Ticket Breakdown
    let breakdownHtml = "";
    let fg = (order.ticketFares && order.ticketFares.general);
    let fs = (order.ticketFares && order.ticketFares.student);
    let fe = (order.ticketFares && order.ticketFares.elder);
    let fch = (order.ticketFares && order.ticketFares.charity);
    let fc = (order.ticketFares && order.ticketFares.child);
    
    let tkts = order.tickets || { general: 1, student: 0, elder: 0, charity: 0, child: 0 };
    let carType = order.carType || "standard";
    
    // 相容舊訂單：若無票價紀錄則重新計算
    if (fg === undefined) {
        let dist = 0;
        if(typeof getDistance === "function") dist = getDistance(order.origin, order.dest);
        let br = 2.9; // 預設自強號
        if(order.trainType && order.trainType.includes("區間快")) br = 2.3;
        else if(order.trainType && order.trainType.includes("區間")) br = 1.8;
        
        let orderDepDate = parseLocalJSDate(order.date, order.depTime);
        let hoursToDep = (orderDepDate - new Date()) / (1000 * 60 * 60);
        if (hoursToDep < 0) hoursToDep = 0;
        
        fg = calculateTrainFare(dist, br, carType, "一般票", hoursToDep);
        fs = calculateTrainFare(dist, br, carType, "學生票", hoursToDep);
        fe = calculateTrainFare(dist, br, carType, "敬老票", hoursToDep);
        fch = calculateTrainFare(dist, br, carType, "愛心票", hoursToDep);
        fc = calculateTrainFare(dist, br, carType, "兒童票", hoursToDep);
    }
    
    if(tkts.general > 0) breakdownHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:3px;"><span>一般票 x ${tkts.general}</span><span>$${tkts.general * fg}</span></div>`;
    if(tkts.student > 0) breakdownHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:3px;"><span>學生票 x ${tkts.student}</span><span>$${tkts.student * fs}</span></div>`;
    if(tkts.elder > 0) breakdownHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:3px;"><span>敬老票 x ${tkts.elder}</span><span>$${tkts.elder * fe}</span></div>`;
    if(tkts.charity > 0) breakdownHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:3px;"><span>愛心票 x ${tkts.charity}</span><span>$${tkts.charity * fch}</span></div>`;
    if(tkts.child > 0) breakdownHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:3px;"><span>兒童票 x ${tkts.child}</span><span>$${tkts.child * fc}</span></div>`;
    
    document.getElementById("paymentTicketBreakdown").innerHTML = breakdownHtml;

    // Points logic
    let pointsContainer = document.getElementById("pointsDiscountContainer");
    let checkbox = document.getElementById("usePointsCheckbox");
    if(trainPoints > 0) {
        pointsContainer.style.display = "block";
        document.getElementById("currentPointsDisplay").innerText = trainPoints;
        checkbox.checked = false;
        checkbox.dataset.originalAmount = amount;
        document.getElementById("pointsDiscountAmount").innerText = "- $0";
    } else {
        pointsContainer.style.display = "none";
        checkbox.dataset.originalAmount = amount;
    }

    // Default to credit card
    let defaultRadio = document.querySelector('input[name="payMethod"][value="線上付款"]');
    if(defaultRadio) defaultRadio.checked = true;
    togglePaymentForms();
    
    // Reset buttons
    document.getElementById("btnConfirmPay").innerHTML = '<i class="fa-solid fa-lock"></i> 確認並結帳';
    document.getElementById("btnConfirmPay").disabled = false;
    document.getElementById("btnPayLater").disabled = false;
    
    document.getElementById("trainPaymentModal").style.display = "flex";
}

function togglePointsDiscount() {
    let checkbox = document.getElementById("usePointsCheckbox");
    let originalAmount = parseInt(checkbox.dataset.originalAmount) || 0;
    let discount = 0;
    
    if(checkbox.checked) {
        discount = Math.min(trainPoints, originalAmount);
    }
    
    document.getElementById("pointsDiscountAmount").innerText = `- $${discount}`;
    document.getElementById("paymentTotalAmount").innerText = "$" + (originalAmount - discount);
}

function togglePaymentForms() {
    let checkedRadio = document.querySelector('input[name="payMethod"]:checked');
    if(!checkedRadio) return;
    let method = checkedRadio.value;
    document.getElementById("formCreditCard").style.display = (method === "線上付款") ? "block" : "none";
    document.getElementById("formStore").style.display = (method === "超商付款") ? "block" : "none";
    document.getElementById("formBank").style.display = (method === "銀行轉帳") ? "block" : "none";
}

function simulatePaymentProcessing() {
    if(!currentPaymentOrderId) return;
    let method = document.querySelector('input[name="payMethod"]:checked').value;
    let btn = document.getElementById("btnConfirmPay");
    
    // Check points usage
    let usedPoints = 0;
    let checkbox = document.getElementById("usePointsCheckbox");
    if(checkbox && checkbox.checked && checkbox.closest('#pointsDiscountContainer').style.display !== 'none') {
        let originalAmount = parseInt(checkbox.dataset.originalAmount) || 0;
        usedPoints = Math.min(trainPoints, originalAmount);
    }
    
    // UI Loading state
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 處理中...';
    btn.disabled = true;
    document.getElementById("btnPayLater").disabled = true;
    
    setTimeout(async () => {
        let order = trainOrders.find(o => o.id === currentPaymentOrderId);
        if(order) {
            order.paymentMethod = method; // 記錄付款方式
            
            // Deduct points & update order
            if(usedPoints > 0) {
                trainPoints -= usedPoints;
                order.usedPoints = usedPoints;
                order.finalAmount = order.totalAmount - usedPoints;
            } else {
                order.finalAmount = order.totalAmount;
            }
            
            let extraMsg = "";
            if(usedPoints > 0) extraMsg += `\n(已使用 ${usedPoints} 點折抵)`;
            if(order.invoiceEmail) extraMsg += `\n🧾 已開立並寄送電子發票至：${order.invoiceEmail}`;
            
            if(method === "線上付款") {
                order.status = "已付款";
                
                // Increment booking count and save
                completedBookings++;
                savePointsAndBookings();
                
                // Rewards check
                if(completedBookings % 5 === 0) {
                    trainPoints += 30;
                    savePointsAndBookings();
                    extraMsg += `\n\n🎉 恭喜！您已累積完成 ${completedBookings} 次訂票，系統額外發送 30 點獎勵！`;
                }
                saveTrainOrders();
                
                document.getElementById("trainPaymentModal").style.display = "none";
                await platformAlert(`結帳成功！使用 [線上付款] ${extraMsg}\n\n您可以在「我的車票」中查看詳細資訊。`, "success");
                
                // Trigger Itinerary Integration
                if (typeof promptIntegrationModal === 'function') {
                    promptIntegrationModal(order, 'train');
                }
            } else {
                if(method === "超商付款") {
                    order.paymentCode = "CWT" + Math.floor(Math.random()*1000000000);
                    extraMsg += `\n請至超商機台輸入繳費代碼：${order.paymentCode}`;
                } else if(method === "銀行轉帳") {
                    order.paymentCode = "808-" + Math.floor(Math.random()*10000000000000);
                    extraMsg += `\n請轉帳至虛擬帳號：${order.paymentCode}`;
                }
                order.status = "待繳費";
                saveTrainOrders();
                
                document.getElementById("trainPaymentModal").style.display = "none";
                await platformAlert(`訂單保留成功！使用 [${method}] ${extraMsg}\n\n請於指定時間內完成轉帳/繳費，否則將自動取消。`, "warning");
            }
            
            await checkTrainDelayCompensate(order);
            if(document.getElementById("myTrainOrdersModal").style.display === "flex") {
                openMyTrainOrders(); // 重新渲染列表
            }
        } else {
            await platformAlert("付款失敗，請重試！", "error");
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> 確認並結帳';
            btn.disabled = false;
            document.getElementById("btnPayLater").disabled = false;
        }
    }, 1500); // 模擬1.5秒連線延遲
}

async function simulateCompletePayment(orderId) {
    let order = trainOrders.find(o => o.id === orderId);
    if(order) {
        order.status = "已付款";
        
        completedBookings++;
        savePointsAndBookings();
        
        let extraMsg = "";
        if(completedBookings % 5 === 0) {
            trainPoints += 30;
            savePointsAndBookings();
            extraMsg = `\n\n🎉 恭喜！您已累積完成 ${completedBookings} 次訂票，系統額外發送 30 點獎勵！`;
        }
        if(order.invoiceEmail) {
            extraMsg += `\n🧾 已開立並寄送電子發票至：${order.invoiceEmail}`;
        }
        saveTrainOrders();
        await platformAlert(`系統已確認收到您的款項，轉帳/繳費成功！${extraMsg}`, "success");
        openMyTrainOrders();
        
        // Trigger Itinerary Integration
        if (typeof promptIntegrationModal === 'function') {
            promptIntegrationModal(order, 'train');
        }
    }
}

function showTrainSchedule(trainNo, origin, dest) {
    let train = mockSchedules.find(t => t.trainNo === trainNo);
    document.getElementById("scheduleModalTitle").innerHTML = `<i class="fa-solid fa-clock"></i> ${train.type} (${train.trainNo}) 沿途停靠站與狀態`;
    
    let allStations = Object.keys(stationDistances);
    let oIdx = allStations.indexOf(origin);
    let dIdx = allStations.indexOf(dest);
    
    let stops = [];
    if (oIdx !== -1 && dIdx !== -1) {
        let step = oIdx < dIdx ? 1 : -1;
        let isDelayed = train.status.includes("延誤");
        let delayMin = isDelayed ? (parseInt(train.status.replace(/[^0-9]/g, '')) || 5) : 0;
        
        let startTotalMins = parseInt(train.depTime.split(':')[0]) * 60 + parseInt(train.depTime.split(':')[1]);
        let endTotalMins = parseInt(train.arrTime.split(':')[0]) * 60 + parseInt(train.arrTime.split(':')[1]);
        if(endTotalMins < startTotalMins) endTotalMins += 24*60;
        let totalDuration = endTotalMins - startTotalMins;
        
        let pathLength = Math.abs(dIdx - oIdx);
        
        for (let i = oIdx; i !== dIdx + step; i += step) {
            let progress = Math.abs(i - oIdx) / pathLength;
            let currentMins = startTotalMins + Math.round(totalDuration * progress);
            let h = Math.floor(currentMins / 60) % 24;
            let m = currentMins % 60;
            let timeStr = h.toString().padStart(2, '0') + ":" + m.toString().padStart(2, '0');
            
            let currentDelay = (progress >= 0.5 && isDelayed) ? delayMin : 0;
            
            let arrTime = (i === oIdx) ? "-" : timeStr;
            let depTime = (i === dIdx) ? "-" : timeStr;
            
            stops.push({
                station: allStations[i],
                arr: arrTime,
                dep: depTime,
                delay: currentDelay
            });
        }
    }
    
    let html = `<table class="data-table">
        <thead>
            <tr><th>車站</th><th>抵達時間</th><th>出發時間</th><th>狀態</th></tr>
        </thead>
        <tbody>`;
        
    stops.forEach(s => {
        let statusHtml = s.delay > 0 ? `<span style="color:red; font-weight:bold;">晚 ${s.delay} 分</span>` : `<span style="color:green;">準點</span>`;
        if (s.arr === "-" && s.dep === "-") statusHtml = "-"; // Fallback
        html += `<tr>
            <td>${s.station}</td>
            <td>${s.arr}</td>
            <td>${s.dep}</td>
            <td>${statusHtml}</td>
        </tr>`;
    });
    html += `</tbody></table>`;
    
    document.getElementById("trainScheduleContainer").innerHTML = html;
    document.getElementById("trainScheduleModal").style.display = "flex";
}

// ==========================================
// C模組新增：線上特殊票種證明文件驗證系統
// ==========================================

let currentVerificationIndex = null;
let currentVerificationType = null;

function openProofVerificationModal(passengerIndex, ticketType) {
    currentVerificationIndex = passengerIndex;
    currentVerificationType = ticketType;
    
    let rows = document.getElementById("bookingPassengersContainer").querySelectorAll(".passenger-row");
    let pName = rows[passengerIndex].querySelector(".p-name").value.trim() || ("乘客 " + (passengerIndex + 1));
    let pId = rows[passengerIndex].querySelector(".p-id").value.trim() || "(未填寫)";
    
    document.getElementById("verificationPassengerInfo").innerHTML = `
        <strong>對象乘客：</strong>${pName} <br>
        <strong>預訂票種：</strong><span style="color:var(--danger-color); font-weight:bold;">${ticketType}</span> <br>
        <strong>證件號碼：</strong>${pId}
    `;
    
    let formContent = "";
    if (ticketType === "學生票") {
        formContent = `
        <div class="form-group">
            <label>就讀學校名稱 <span style="color:var(--danger-color);">*</span></label>
            <input type="text" id="verifySchoolName" class="form-control" placeholder="例如：國立暨南國際大學" style="padding:6px 10px;">
        </div>
        <div class="form-group">
            <label>學生證學號 <span style="color:var(--danger-color);">*</span></label>
            <input type="text" id="verifyStudentId" class="form-control" placeholder="例如：D11242301" style="padding:6px 10px;">
        </div>
        `;
    } else if (ticketType === "敬老票") {
        formContent = `
        <div id="verifyCategoryForm_senior">
            <div class="form-group">
                <label>出生年月日 (檢核年滿 65 歲) <span style="color:var(--danger-color);">*</span></label>
                <input type="date" id="verifyBirthDate" class="form-control" value="1955-01-01" style="padding:6px 10px;">
            </div>
        </div>
        `;
    } else if (ticketType === "愛心票") {
        formContent = `
        <div id="verifyCategoryForm_charity">
            <div class="form-group">
                <label>身心障礙證明編號 (16碼編號) <span style="color:var(--danger-color);">*</span></label>
                <input type="text" id="verifyDisabilityNo" class="form-control" placeholder="例如：1090123456789012" style="padding:6px 10px;">
            </div>
            <div class="form-group">
                <label>重新鑑定日期 (手冊效期) <span style="color:var(--danger-color);">*</span></label>
                <input type="date" id="verifyReEvalDate" class="form-control" value="2028-12-31" style="padding:6px 10px;">
            </div>
            <div class="form-group">
                <label>障礙類別</label>
                <select id="verifyDisabilityType" class="form-control" style="padding:6px 10px;">
                    <option value="肢體障礙">肢體障礙</option>
                    <option value="聽覺障礙">聽覺障礙</option>
                    <option value="視覺障礙">視覺障礙</option>
                    <option value="心智障礙">智能/心智障礙</option>
                    <option value="其他障礙">其他類別</option>
                </select>
            </div>
        </div>
        `;
    }
    
    document.getElementById("verificationFormContent").innerHTML = formContent;
    
    // 重設照片上傳區
    document.getElementById("proofFileInput").value = "";
    document.getElementById("proofPreviewImg").src = "";
    document.getElementById("proofPreviewImg").style.display = "none";
    
    // 隱藏辨識與結果
    document.getElementById("ocrScanningArea").style.display = "none";
    document.getElementById("verificationResultArea").innerHTML = "";
    document.getElementById("verificationResultArea").style.display = "none";
    
    // 還原按鈕狀態
    document.getElementById("btnSubmitVerification").style.display = "inline-flex";
    document.getElementById("btnSubmitVerification").disabled = false;
    document.getElementById("btnTestProofData").style.display = "inline-flex";
    
    document.getElementById("trainProofVerificationModal").style.display = "flex";
}

function closeProofVerificationModal() {
    document.getElementById("trainProofVerificationModal").style.display = "none";
    rebuildPassengerFields(); // 刷新乘客資料顯示
}

function toggleVerifyCategoryForm(category) {
    let seniorForm = document.getElementById("verifyCategoryForm_senior");
    let charityForm = document.getElementById("verifyCategoryForm_charity");
    if(seniorForm) seniorForm.style.display = (category === "senior") ? "block" : "none";
    if(charityForm) charityForm.style.display = (category === "charity") ? "block" : "none";
}

function handleProofFileSelected(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            let img = document.getElementById("proofPreviewImg");
            img.src = e.target.result;
            img.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
}

function applyTestVerificationData() {
    if (!currentVerificationType) return;
    
    if (currentVerificationType === "學生票") {
        document.getElementById("verifySchoolName").value = "國立暨南國際大學";
        document.getElementById("verifyStudentId").value = "D11242301";
        
        // 繪製模擬學生證照片
        let canvas = document.createElement("canvas");
        canvas.width = 300; canvas.height = 180;
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = "#4A5D4E"; ctx.fillRect(0,0,300,180);
        ctx.fillStyle = "#fff"; ctx.fillRect(10,10,280,160);
        ctx.fillStyle = "#4A5D4E"; ctx.font = "bold 14px sans-serif"; ctx.fillText("STUDENT IDENTIFICATION", 20, 35);
        ctx.fillStyle = "#d9a05b"; ctx.fillRect(20, 45, 260, 4);
        ctx.fillStyle = "#332c26"; ctx.font = "bold 12px sans-serif"; ctx.fillText("學校: 國立暨南國際大學", 30, 85);
        ctx.fillText("姓名: 預設測試學生", 30, 110);
        ctx.fillText("學號: D11242301", 30, 135);
        ctx.fillStyle = "#e0e0e0"; ctx.fillRect(200, 70, 70, 80);
        ctx.fillStyle = "#888"; ctx.font = "9px sans-serif"; ctx.fillText("MOCK PHOTO", 205, 115);
        
        let img = document.getElementById("proofPreviewImg");
        img.src = canvas.toDataURL();
        img.style.display = "block";
        
    } else if (currentVerificationType === "敬老票") {
        document.getElementById("verifyBirthDate").value = "1955-06-15";
        
        // 繪製模擬敬老卡
        let canvas = document.createElement("canvas");
        canvas.width = 300; canvas.height = 180;
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = "#8C7A6B"; ctx.fillRect(0,0,300,180);
        ctx.fillStyle = "#fff"; ctx.fillRect(10,10,280,160);
        ctx.fillStyle = "#8C7A6B"; ctx.font = "bold 14px sans-serif"; ctx.fillText("敬老悠遊卡 (SENIOR CARD)", 20, 35);
        ctx.fillStyle = "#d9a05b"; ctx.fillRect(20, 45, 260, 4);
        ctx.fillStyle = "#332c26"; ctx.font = "bold 12px sans-serif"; ctx.fillText("身分: 敬老悠遊卡", 30, 85);
        ctx.fillText("生日: 民國 44 年 06 月 15 日", 30, 110);
        ctx.fillText("備註: 滿 65 歲符合優待資格", 30, 135);
        ctx.fillStyle = "#e0e0e0"; ctx.fillRect(200, 70, 70, 80);
        ctx.fillStyle = "#888"; ctx.font = "9px sans-serif"; ctx.fillText("MOCK PHOTO", 205, 115);
        
        let img = document.getElementById("proofPreviewImg");
        img.src = canvas.toDataURL();
        img.style.display = "block";
    } else if (currentVerificationType === "愛心票") {
        document.getElementById("verifyDisabilityNo").value = "1090123456789012";
        document.getElementById("verifyReEvalDate").value = "2028-12-31";
        document.getElementById("verifyDisabilityType").value = "肢體障礙";
        
        // 繪製模擬愛心障礙手冊
        let canvas = document.createElement("canvas");
        canvas.width = 300; canvas.height = 180;
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = "#A94A42"; ctx.fillRect(0,0,300,180);
        ctx.fillStyle = "#fff"; ctx.fillRect(10,10,280,160);
        ctx.fillStyle = "#A94A42"; ctx.font = "bold 14px sans-serif"; ctx.fillText("身心障礙證明 (DISABILITY MANUAL)", 20, 35);
        ctx.fillStyle = "#d9a05b"; ctx.fillRect(20, 45, 260, 4);
        ctx.fillStyle = "#332c26"; ctx.font = "bold 12px sans-serif"; ctx.fillText("證號: 1090123456789012", 30, 85);
        ctx.fillText("重新鑑定: 2028-12-31", 30, 110);
        ctx.fillText("類別: 肢體障礙 (已驗證)", 30, 135);
        ctx.fillStyle = "#e0e0e0"; ctx.fillRect(200, 70, 70, 80);
        ctx.fillStyle = "#888"; ctx.font = "9px sans-serif"; ctx.fillText("MOCK PHOTO", 205, 115);
        
        let img = document.getElementById("proofPreviewImg");
        img.src = canvas.toDataURL();
        img.style.display = "block";
    }
}

async function runProofVerification() {
    let img = document.getElementById("proofPreviewImg");
    if (!img.src || img.style.display === "none") {
        await platformAlert("請上傳或拖曳提供您的證明文件照片！", "warning");
        return;
    }
    
    let vData = { verified: false, ticketType: currentVerificationType };
    
    if (currentVerificationType === "學生票") {
        let school = document.getElementById("verifySchoolName").value.trim();
        let studentId = document.getElementById("verifyStudentId").value.trim();
        
        if (!school || !studentId) {
            await platformAlert("請填寫學校名稱與學生證學號！", "warning");
            return;
        }
        
        vData.schoolName = school;
        vData.studentId = studentId;
        vData.summary = school + " " + studentId + " (學生證)";
        vData.verified = true;
        
    } else if (currentVerificationType === "敬老票") {
        let birthVal = document.getElementById("verifyBirthDate").value;
        if (!birthVal) {
            await platformAlert("請輸入您的出生年月日！", "warning");
            return;
        }
        
        // 計算年齡：以系統虛擬目前時間 2026-06-02 為基準
        let birth = parseLocalJSDate(birthVal);
        let today = parseLocalJSDate("2026-06-02");
        let age = today.getFullYear() - birth.getFullYear();
        let m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        if (age < 65) {
            renderVerificationResult(false, `驗證失敗：乘客年齡經計算為 ${age} 歲，未滿 65 歲，不符合敬老票資格！`);
            return;
        }
        
        vData.birthDate = birthVal;
        vData.summary = "年滿 " + age + " 歲 敬老票";
        vData.verified = true;
        
    } else if (currentVerificationType === "愛心票") {
        let disabilityNo = document.getElementById("verifyDisabilityNo").value.trim();
        let reEvalDateVal = document.getElementById("verifyReEvalDate").value;
        let disType = document.getElementById("verifyDisabilityType").value;
        
        if (!disabilityNo || !reEvalDateVal) {
            await platformAlert("請填寫身心障礙手冊證號與重新鑑定日期！", "warning");
            return;
        }
        
        // 檢查手冊是否逾期：以系統目前的 2026-06-02 為基準
        let reEvalDate = parseLocalJSDate(reEvalDateVal);
        let today = parseLocalJSDate("2026-06-02");
        
        if (reEvalDate < today) {
            renderVerificationResult(false, `驗證失敗：該身心障礙手冊已於 ${reEvalDateVal} 逾期，無法訂購愛心優待票！`);
            return;
        }
        
        vData.disabilityNo = disabilityNo;
        vData.reEvalDate = reEvalDateVal;
        vData.disabilityType = disType;
        vData.summary = disType + " (" + disabilityNo.substring(0, 4) + "****) 愛心票";
        vData.verified = true;
    }
    
    // 顯示辨識動畫
    let scanArea = document.getElementById("ocrScanningArea");
    let scanStatus = document.getElementById("ocrScanStatus");
    let btnSubmit = document.getElementById("btnSubmitVerification");
    let btnTest = document.getElementById("btnTestProofData");
    
    scanArea.style.display = "block";
    btnSubmit.disabled = true;
    btnTest.style.display = "none";
    
    scanStatus.innerText = "正在進行影像辨識及特徵優化 (OCR)...";
    
    setTimeout(() => {
        scanStatus.innerText = "正在向內政部學籍與身分資料庫連線核對...";
        
        setTimeout(() => {
            scanArea.style.display = "none";
            
            if (vData.verified) {
                passengerVerifications[currentVerificationIndex] = vData;
                renderVerificationResult(true, `驗證成功！證件核對無誤，已自動記錄為「${vData.summary}」狀態。`);
                
                // 更換按鈕以供套用
                btnSubmit.style.display = "none";
                btnTest.style.display = "none";
                
                let resultArea = document.getElementById("verificationResultArea");
                resultArea.innerHTML += `
                    <div style="text-align:center; margin-top: 15px;">
                        <button class="btn btn-primary" style="width:100%; justify-content:center;" onclick="closeProofVerificationModal()">確認並套用證件資訊</button>
                    </div>
                `;
            }
        }, 1200);
    }, 1000);
}

function renderVerificationResult(isSuccess, message) {
    let resultArea = document.getElementById("verificationResultArea");
    resultArea.style.display = "block";
    
    if (isSuccess) {
        resultArea.innerHTML = `
            <div class="verification-alert success">
                <i class="fa-solid fa-circle-check" style="font-size: 16px; margin-top: 2px;"></i>
                <div>
                    <strong>證件審核通過</strong><br>
                    ${message}
                </div>
            </div>
        `;
    } else {
        resultArea.innerHTML = `
            <div class="verification-alert danger">
                <i class="fa-solid fa-circle-xmark" style="font-size: 16px; margin-top: 2px;"></i>
                <div>
                    <strong>證件審核失敗</strong><br>
                    ${message}
                </div>
            </div>
        `;
        document.getElementById("btnSubmitVerification").disabled = false;
        document.getElementById("btnTestProofData").style.display = "inline-flex";
    }
}

