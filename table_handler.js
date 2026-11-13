/**
 * Future Academy - Interactive Scoreboard Handler
 * Loads live data from DataManager (with fallback to HTML tables).
 * Supports coach admin authentication, sound effects, and seamless group navigation.
 */

let soundMuted = false;
let myAudio = null;
let hasPlayedSound = false;

function playSound() {
    if (soundMuted) return;
    try {
        if (!myAudio) {
            myAudio = new Audio('./retro_load.mp3');
            myAudio.volume = 0.5;
        }
        // Stop any playing instance first to prevent echo/phasing distortion
        myAudio.pause();
        myAudio.currentTime = 0;
        const playPromise = myAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                hasPlayedSound = true;
            }).catch(e => {
                // Autoplay blocked by browser policy until interaction
            });
        }
    } catch (e) {
        console.log("Audio notice:", e);
    }
}

// Fallback: If browser blocked autoplay on load, play cleanly ONCE on first touch/click
function onFirstUserGesture() {
    if (!hasPlayedSound) {
        playSound();
    }
    ['click', 'touchstart'].forEach(evt => {
        document.removeEventListener(evt, onFirstUserGesture);
    });
}

['click', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, onFirstUserGesture, { once: true });
});

function getCurrentPageNo() {
    // 1. Check URL query params: ?page=X or ?g=X
    const urlParams = new URLSearchParams(window.location.search);
    const queryPage = urlParams.get('page') || urlParams.get('g');
    if (queryPage) {
        const parsed = parseInt(queryPage, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    // 2. Check title id="page-no"
    const pageNoElm = document.getElementById("page-no");
    if (pageNoElm) {
        const parsed = parseInt(pageNoElm.innerText.trim(), 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    // 3. Fallback to filename: scores_g3.html -> 3
    const match = window.location.pathname.match(/scores_g(\d+)\.html/);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }

    return 1;
}

function getGroupPageUrl(page) {
    if (page <= 6) {
        return `scores_g${page}.html`;
    }
    // Dynamic fallback for newly added groups beyond Group 6
    return `scores_g1.html?page=${page}`;
}

function paginationUpdate() {
    const tablePgNo = getCurrentPageNo();
    const pagination = document.querySelector(".pagination");
    if (!pagination) return;

    // Determine total pages from DataManager or fallback
    let totalPages = 6;
    if (typeof DataManager !== "undefined") {
        const allGroups = DataManager.getAllGroups();
        if (allGroups.length > 0) {
            totalPages = allGroups.length;
        }
    }

    pagination.innerHTML = "";

    // Previous Button
    const prevPage = tablePgNo > 1 ? tablePgNo - 1 : 1;
    const prevA = document.createElement("a");
    prevA.innerHTML = "&laquo;";
    prevA.setAttribute("href", getGroupPageUrl(prevPage));
    prevA.title = "المجموعة السابقة";
    pagination.appendChild(prevA);

    // Numbered Group Buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageA = document.createElement("a");
        pageA.innerText = i;
        pageA.title = `Group ${i}`;
        if (i === tablePgNo) {
            pageA.className = "active";
        }
        pageA.setAttribute("href", getGroupPageUrl(i));
        pagination.appendChild(pageA);
    }

    // Next Button
    const nextPage = tablePgNo < totalPages ? tablePgNo + 1 : totalPages;
    const nextA = document.createElement("a");
    nextA.innerHTML = "&raquo;";
    nextA.setAttribute("href", getGroupPageUrl(nextPage));
    nextA.title = "المجموعة التالية";
    pagination.appendChild(nextA);
}

function parseScoreTableFromDOM() {
    const rawTable = document.querySelector("table");
    if (!rawTable) return { criteria: [], students: [] };

    const trs = Array.from(rawTable.querySelectorAll("tr"));
    if (trs.length === 0) return { criteria: [], students: [] };

    const headerRow = trs.find(tr => tr.querySelectorAll("th").length > 0) || trs[0];
    const ths = Array.from(headerRow.querySelectorAll("th"));

    let criteriaHeaders = [];
    let hasExplicitTotal = false;

    if (ths.length > 2) {
        const lastThText = ths[ths.length - 1].innerText.trim().toLowerCase();
        const isLastTotal = /total|score|مجموع|المجموع|الدرجة|إجمالي|اجمالي/.test(lastThText);

        if (isLastTotal && ths.length > 3) {
            hasExplicitTotal = true;
            criteriaHeaders = ths.slice(2, ths.length - 1);
        } else if (isLastTotal && ths.length === 3) {
            hasExplicitTotal = true;
            criteriaHeaders = [];
        } else {
            hasExplicitTotal = false;
            criteriaHeaders = ths.slice(2);
        }
    }

    const criteriaMeta = criteriaHeaders.map((th, index) => {
        const rawText = th.innerText.trim();
        let icon = "⭐";

        if (/attendance|حضور|غياب/i.test(rawText)) icon = "📅";
        else if (/task|تاسك|واجب|مهام|homework/i.test(rawText)) icon = "📝";
        else if (/partic|مشارك|تفاعل|نشاط|active/i.test(rawText)) icon = "⭐";
        else if (/quiz|كويز|امتحان|اختبار/i.test(rawText)) icon = "🎯";
        else if (/project|مشروع/i.test(rawText)) icon = "🚀";
        else if (/bonus|بونص|إضافي/i.test(rawText)) icon = "⚡";

        const emojiMatch = rawText.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
        if (emojiMatch) icon = emojiMatch[0];

        const cleanLabel = rawText.replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu, "").trim();

        return {
            raw: rawText,
            label: cleanLabel || rawText,
            icon: icon,
            colorIndex: index % 6
        };
    });

    const students = [];
    trs.forEach(tr => {
        const tds = Array.from(tr.querySelectorAll("td"));
        if (tds.length < 2) return;

        const name = tds[1].innerText.trim();
        if (!name) return;

        let studentCriteria = [];
        let criteriaSum = 0;

        criteriaMeta.forEach((meta, idx) => {
            const colIndex = 2 + idx;
            let val = 0;
            if (tds[colIndex]) {
                val = parseInt(tds[colIndex].innerText.trim(), 10);
                if (isNaN(val)) val = 0;
            }
            criteriaSum += val;
            studentCriteria.push({
                ...meta,
                score: val
            });
        });

        let total = criteriaSum;
        if (hasExplicitTotal) {
            const totalColIdx = ths.length - 1;
            if (tds[totalColIdx]) {
                const parsedTotal = parseInt(tds[totalColIdx].innerText.trim(), 10);
                if (!isNaN(parsedTotal)) total = parsedTotal;
            }
        } else if (criteriaMeta.length === 0 && tds[2]) {
            total = parseInt(tds[2].innerText.trim(), 10) || 0;
        }

        students.push({
            name: name,
            criteria: studentCriteria,
            total: total
        });
    });

    return {
        criteria: criteriaMeta,
        students: students
    };
}

function scoreTableUpdate() {
    const tableDiv = document.querySelector(".table-div");
    if (!tableDiv) return;

    const pageNo = getCurrentPageNo();
    let students = [];
    let criteria = [];
    let groupTitle = "";

    // 1. Try to load live data from DataManager (LocalStorage / Coach edits)
    if (typeof DataManager !== "undefined") {
        const groupData = DataManager.getGroup(pageNo);
        if (groupData) {
            groupTitle = groupData.title || `Group ${pageNo}`;
            criteria = (groupData.criteria || []).map((critText, idx) => {
                let icon = "⭐";
                if (/attendance|حضور|غياب/i.test(critText)) icon = "📅";
                else if (/task|تاسك|واجب|مهام|homework/i.test(critText)) icon = "📝";
                else if (/partic|مشارك|تفاعل|نشاط/i.test(critText)) icon = "⭐";
                else if (/quiz|كويز/i.test(critText)) icon = "🎯";
                else if (/project|مشروع/i.test(critText)) icon = "🚀";

                const emojiMatch = critText.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
                if (emojiMatch) icon = emojiMatch[0];

                const cleanLabel = critText.replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu, "").trim();

                return {
                    raw: critText,
                    label: cleanLabel || critText,
                    icon: icon,
                    colorIndex: idx % 6
                };
            });

            students = (groupData.students || []).map(s => {
                const studentCriteria = criteria.map((c, cIdx) => ({
                    ...c,
                    score: Number(s.scores[cIdx]) || 0
                }));
                const total = s.total !== undefined ? Number(s.total) : studentCriteria.reduce((sum, c) => sum + c.score, 0);
                return {
                    name: s.name,
                    criteria: studentCriteria,
                    total: total
                };
            });
        }
    }

    // 2. Fallback to HTML table if DataManager has no students
    if (students.length === 0) {
        const parsed = parseScoreTableFromDOM();
        students = parsed.students;
        criteria = parsed.criteria;
    }

    if (students.length === 0) return;

    // Sort descending by total score
    students.sort((a, b) => b.total - a.total);

    // Assign ranking positions
    let currentPos = 1;
    let prevTotal = null;
    students.forEach((student, idx) => {
        if (prevTotal !== null && student.total < prevTotal) {
            currentPos = idx + 1;
        }
        student.pos = currentPos;
        prevTotal = student.total;
    });

    // Update group subtitle in DOM
    if (groupTitle) {
        const badgeH3 = document.querySelector(".group-badge h3");
        if (badgeH3) {
            badgeH3.innerText = `(${groupTitle})`;
        }
    }

    // Remove existing raw table
    const oldTable = tableDiv.querySelector("table");
    if (oldTable) oldTable.remove();
    const oldContainer = tableDiv.querySelector(".scoreboard-container");
    if (oldContainer) oldContainer.remove();

    // Create container
    const container = document.createElement("div");
    container.className = "scoreboard-container";

    // Header Title
    const headerWrapper = document.createElement("div");
    headerWrapper.className = "scoreboard-header";

    const titleDiv = document.createElement("div");
    titleDiv.className = "table-title";
    const h1 = document.createElement("h1");
    h1.innerHTML = `S C O R E S 🚀`;
    titleDiv.appendChild(h1);
    headerWrapper.appendChild(titleDiv);

    // Clean Controls Bar (Stats + Audio + Secret Coach Button) - NO View Mode Toggle!
    const controlsBar = document.createElement("div");
    controlsBar.className = "scoreboard-controls";

    const topStudent = students[0];
    controlsBar.innerHTML = `
        <div class="stat-badge students-count">
            <span class="stat-icon">👥</span>
            <span>${students.length} Students</span>
        </div>
        ${topStudent && topStudent.total > 0 ? `
        <div class="stat-badge top-student">
            <span class="stat-icon">👑</span>
            <span>Leader: <strong>${escapeHtml(topStudent.name)}</strong> (${topStudent.total} pts)</span>
        </div>
        ` : ''}
        <div class="controls-actions">
            <button id="sound-toggle-btn" class="control-btn sound-btn" type="button" title="كتم / تشغيل الصوت">
                <span class="sound-icon">🔊</span>
            </button>
            <a href="admin.html" id="coach-admin-btn" class="control-btn coach-lock-btn" title="لوحة تحكم المهندس 🔐">
                <span>🔐</span>
            </a>
        </div>
    `;
    headerWrapper.appendChild(controlsBar);
    container.appendChild(headerWrapper);

    // Scoreboard Table
    const table = document.createElement("table");
    table.className = "scoreboard-table";
    table.id = "scoreboard-table";

    // Table Head (for Desktop view)
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");

    const thPos = document.createElement("th");
    thPos.className = "th-pos";
    thPos.innerText = "Pos";
    trHead.appendChild(thPos);

    const thName = document.createElement("th");
    thName.className = "th-name";
    thName.innerText = "Name";
    trHead.appendChild(thName);

    criteria.forEach((c, idx) => {
        const thCrit = document.createElement("th");
        thCrit.className = `th-criterion th-crit-${idx}`;
        thCrit.innerHTML = `<span class="th-crit-icon">${c.icon}</span> ${escapeHtml(c.label)}`;
        trHead.appendChild(thCrit);
    });

    const thTotal = document.createElement("th");
    thTotal.className = "th-total";
    thTotal.innerHTML = `Total 🏆`;
    trHead.appendChild(thTotal);

    thead.appendChild(trHead);
    table.appendChild(thead);

    // Table Body
    const tbody = document.createElement("tbody");

    const avatarGradients = [
        'linear-gradient(135deg, #FF6B6B, #EE5253)',
        'linear-gradient(135deg, #48DBFB, #0ABDE3)',
        'linear-gradient(135deg, #1DD1A1, #10AC84)',
        'linear-gradient(135deg, #F368E0, #FF9FF3)',
        'linear-gradient(135deg, #FFA502, #FF7F50)',
        'linear-gradient(135deg, #5F27CD, #341F97)',
        'linear-gradient(135deg, #2E86DE, #54A0FF)',
    ];

    students.forEach((student, index) => {
        const tr = document.createElement("tr");
        tr.className = "student-row";
        tr.dataset.pos = student.pos;

        let rankClass = "rank-other";
        let rankIconHtml = `<span class="rank-num">${student.pos}</span>`;

        if (student.pos === 1 && student.total > 0) {
            rankClass = "top rank-1";
            rankIconHtml = `<span class="crown-icon" title="1st Place">👑</span> <span class="rank-num">1</span>`;
        } else if (student.pos === 2 && student.total > 0) {
            rankClass = "second rank-2";
            rankIconHtml = `<span class="medal-icon silver" title="2nd Place">🥈</span> <span class="rank-num">2</span>`;
        } else if (student.pos === 3 && student.total > 0) {
            rankClass = "third rank-3";
            rankIconHtml = `<span class="medal-icon bronze" title="3rd Place">🥉</span> <span class="rank-num">3</span>`;
        }
        tr.classList.add(...rankClass.split(" "));

        // Column 1: Pos (Rank)
        const tdPos = document.createElement("td");
        tdPos.className = "col-pos";
        tdPos.innerHTML = `<div class="rank-badge">${rankIconHtml}</div>`;
        tr.appendChild(tdPos);

        // Column 2: Name with initial avatar
        const tdName = document.createElement("td");
        tdName.className = "col-name";
        const initial = student.name.trim().charAt(0).toUpperCase() || "S";
        const avatarBg = avatarGradients[index % avatarGradients.length];
        tdName.innerHTML = `
            <div class="student-profile">
                <div class="student-avatar" style="background: ${avatarBg}">${initial}</div>
                <div class="student-name">${escapeHtml(student.name)}</div>
            </div>
        `;
        tr.appendChild(tdName);

        // Columns: Criteria Chips
        if (criteria.length > 0) {
            student.criteria.forEach((c, cIdx) => {
                const tdCrit = document.createElement("td");
                tdCrit.className = `col-criterion col-crit-${cIdx}`;
                tdCrit.setAttribute("data-label", c.label);
                tdCrit.title = `${c.label}: ${c.score}`;
                tdCrit.innerHTML = `
                    <div class="criterion-chip chip-color-${c.colorIndex}">
                        <span class="chip-icon">${c.icon}</span>
                        <span class="chip-label">${escapeHtml(c.label)}:</span>
                        <span class="chip-value">${c.score}</span>
                    </div>
                `;
                tr.appendChild(tdCrit);
            });
        }

        // Column: Total Score
        const tdTotal = document.createElement("td");
        tdTotal.className = "col-total";
        tdTotal.innerHTML = `
            <div class="total-score-badge">
                <span class="total-label">Total: </span>
                <span class="total-points">${student.total}</span>
                <span class="total-pts-unit">pts</span>
            </div>
        `;
        tr.appendChild(tdTotal);

        tr.addEventListener("click", () => {
            playSound();
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
    tableDiv.appendChild(container);

    // Audio Mute toggle listener
    const soundBtn = document.getElementById("sound-toggle-btn");
    if (soundBtn) {
        soundBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            soundMuted = !soundMuted;
            soundBtn.querySelector(".sound-icon").innerText = soundMuted ? "🔇" : "🔊";
            if (!soundMuted) playSound();
        });
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str || "";
    return div.innerHTML;
}

// React to cross-tab updates from Admin panel
window.addEventListener("scoreboard_data_updated", () => {
    paginationUpdate();
    scoreTableUpdate();
});

// Initialization
window.addEventListener("DOMContentLoaded", () => {
    paginationUpdate();
    scoreTableUpdate();
});

window.addEventListener("load", () => {
    paginationUpdate();
    if (!document.querySelector(".scoreboard-container")) {
        scoreTableUpdate();
    }
    playSound();
});
