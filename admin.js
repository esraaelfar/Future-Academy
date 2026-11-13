/**
 * Future Academy - Engineer Dashboard Script
 * Connects with DataManager to provide full CRUD for Groups, Students, and Scores.
 * Pure English interface for engineers.
 */

let activeGroupId = 1;

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    setupLogin();
    setupDashboard();
});

/* ========================================================
   AUTHENTICATION & LOGIN
   ======================================================== */
function checkAuth() {
    if (DataManager.isCoachLoggedIn()) {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("dashboard-screen").style.display = "none";
    const pinInput = document.getElementById("pin-input");
    if (pinInput) {
        pinInput.value = "";
        pinInput.focus();
    }
}

function showDashboard() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("dashboard-screen").style.display = "block";
    renderGroupsTabs();
    renderGroupEditor();
}

function setupLogin() {
    const form = document.getElementById("login-form");
    const pinInput = document.getElementById("pin-input");
    const errorMsg = document.getElementById("login-error");

    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const pin = pinInput.value.trim();

        if (DataManager.loginCoach(pin)) {
            errorMsg.style.display = "none";
            showDashboard();
            showToast("Welcome Engineer. Esraa Elfar! Login successful 🚀");
        } else {
            errorMsg.style.display = "block";
            pinInput.value = "";
            pinInput.focus();
            pinInput.classList.add("shake");
            setTimeout(() => pinInput.classList.remove("shake"), 500);
        }
    });

    document.getElementById("btn-logout").addEventListener("click", () => {
        DataManager.logoutCoach();
        showLogin();
        showToast("Logged out successfully");
    });
}

/* ========================================================
   DASHBOARD & WORKSPACE
   ======================================================== */
function setupDashboard() {
    // Add Group Button
    document.getElementById("btn-add-group").addEventListener("click", handleAddGroup);

    // Save Group Title Button
    document.getElementById("btn-save-group-title").addEventListener("click", handleSaveGroupTitle);

    // Delete Group Button
    document.getElementById("btn-delete-group").addEventListener("click", handleDeleteGroup);

    // Add Student Button
    document.getElementById("btn-add-student").addEventListener("click", handleAddStudent);

    // Save All Changes Button
    document.getElementById("btn-save-all").addEventListener("click", handleSaveAllChanges);

    // Excel Export & Import Buttons
    const btnExportAll = document.getElementById("btn-export-excel-all");
    if (btnExportAll) btnExportAll.addEventListener("click", exportAllGroupsToExcel);

    const btnExportActive = document.getElementById("btn-export-excel-active");
    if (btnExportActive) btnExportActive.addEventListener("click", exportActiveGroupToExcel);

    const btnDownloadTpl = document.getElementById("btn-download-template");
    if (btnDownloadTpl) btnDownloadTpl.addEventListener("click", downloadExcelTemplate);

    const btnImportExcel = document.getElementById("btn-import-excel");
    const importExcelInput = document.getElementById("import-excel-input");
    if (btnImportExcel && importExcelInput) {
        btnImportExcel.addEventListener("click", () => importExcelInput.click());
        importExcelInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) importExcelFile(file);
            e.target.value = "";
        });
    }

    const btnResetDefault = document.getElementById("btn-reset-default");
    if (btnResetDefault) btnResetDefault.addEventListener("click", handleResetDefaults);

    // Change PIN Modal
    setupPinModal();
}

/* ========================================================
   GROUPS MANAGEMENT
   ======================================================== */
function renderGroupsTabs() {
    const container = document.getElementById("groups-tabs-container");
    container.innerHTML = "";

    const groups = DataManager.getAllGroups();
    if (groups.length === 0) return;

    // Verify activeGroupId exists
    if (!groups.find(g => Number(g.id) === Number(activeGroupId))) {
        activeGroupId = groups[0].id;
    }

    groups.forEach(group => {
        const btn = document.createElement("button");
        btn.className = `group-tab-btn ${Number(group.id) === Number(activeGroupId) ? 'active' : ''}`;
        btn.innerText = `Group ${group.id}`;
        btn.title = group.title || `Group ${group.id}`;
        btn.addEventListener("click", () => {
            activeGroupId = group.id;
            renderGroupsTabs();
            renderGroupEditor();
        });
        container.appendChild(btn);
    });

    // Update View Scoreboard Link to current group
    const viewBtn = document.getElementById("btn-view-scoreboard");
    if (viewBtn) {
        viewBtn.setAttribute("href", `scores_g${activeGroupId}.html`);
    }
}

function renderGroupEditor() {
    const group = DataManager.getGroup(activeGroupId);
    if (!group) return;

    // Set Group Title input
    const titleInput = document.getElementById("group-title-input");
    titleInput.value = group.title || "";

    // Set Students count
    document.getElementById("students-count-num").innerText = group.students.length;

    // Render Table Headers (Criteria)
    const theadRow = document.getElementById("table-headers-row");
    theadRow.innerHTML = `
        <th style="width: 45px;">#</th>
        <th>Student Name</th>
    `;

    group.criteria.forEach((criterion) => {
        const th = document.createElement("th");
        th.innerText = criterion;
        theadRow.appendChild(th);
    });

    const thTotal = document.createElement("th");
    thTotal.innerText = "Total 🏆";
    theadRow.appendChild(thTotal);

    const thAction = document.createElement("th");
    thAction.style.width = "75px";
    thAction.innerText = "Action";
    theadRow.appendChild(thAction);

    // Render Students Table Body
    renderStudentsRows(group);
}

function handleAddGroup() {
    const defaultName = `Group ${DataManager.getAllGroups().length + 1}`;
    const title = prompt("Enter title or schedule for the new group:", defaultName);
    if (title === null) return;

    const newGroup = DataManager.addGroup(title.trim() || defaultName);
    activeGroupId = newGroup.id;
    renderGroupsTabs();
    renderGroupEditor();
    showToast(`${newGroup.title} added successfully! 🚀`);
}

function handleSaveGroupTitle() {
    const titleInput = document.getElementById("group-title-input");
    const newTitle = titleInput.value.trim();
    if (!newTitle) return;

    DataManager.updateGroup(activeGroupId, { title: newTitle });
    renderGroupsTabs();
    showToast("Group title updated successfully! ✅");
}

function handleDeleteGroup() {
    const group = DataManager.getGroup(activeGroupId);
    if (!group) return;

    if (confirm(`Are you sure you want to delete ${group.title}? This action cannot be undone.`)) {
        try {
            DataManager.deleteGroup(activeGroupId);
            activeGroupId = DataManager.getAllGroups()[0].id;
            renderGroupsTabs();
            renderGroupEditor();
            showToast("Group deleted successfully!");
        } catch (err) {
            alert(err.message);
        }
    }
}

/* ========================================================
   STUDENTS & SCORES TABLE EDITING
   ======================================================== */
function renderStudentsRows(group) {
    const tbody = document.getElementById("students-table-body");
    tbody.innerHTML = "";

    if (group.students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${group.criteria.length + 4}" style="padding: 30px; color: #94A3B8; font-weight: 700;">
                    No students in this group yet. Click <strong>➕ Add New Student</strong> to start!
                </td>
            </tr>
        `;
        return;
    }

    group.students.forEach((student, studentIdx) => {
        const tr = document.createElement("tr");
        tr.dataset.studentIndex = studentIdx;

        // Column 1: Index Number
        const tdIdx = document.createElement("td");
        tdIdx.innerHTML = `<strong>${studentIdx + 1}</strong>`;
        tr.appendChild(tdIdx);

        // Column 2: Name Input
        const tdName = document.createElement("td");
        tdName.innerHTML = `
            <input type="text" class="student-name-input" value="${escapeHtml(student.name)}" placeholder="Student Name">
        `;
        tr.appendChild(tdName);

        // Dynamic Criteria Score Steppers
        group.criteria.forEach((crit, critIdx) => {
            const tdCrit = document.createElement("td");
            const scoreVal = Number(student.scores[critIdx]) || 0;

            tdCrit.innerHTML = `
                <div class="score-stepper">
                    <button type="button" class="step-btn minus-btn" data-crit="${critIdx}">-</button>
                    <input type="number" class="criterion-score-input" data-crit="${critIdx}" value="${scoreVal}" min="0" max="100">
                    <button type="button" class="step-btn plus-btn" data-crit="${critIdx}">+</button>
                </div>
            `;
            tr.appendChild(tdCrit);
        });

        // Column: Total Badge (live calculated)
        const tdTotal = document.createElement("td");
        tdTotal.innerHTML = `
            <span class="admin-total-badge total-badge-${studentIdx}">${student.total}</span>
        `;
        tr.appendChild(tdTotal);

        // Column: Delete Button
        const tdDelete = document.createElement("td");
        tdDelete.innerHTML = `
            <button type="button" class="btn-delete-student" title="Delete Student">🗑️</button>
        `;
        tdDelete.querySelector(".btn-delete-student").addEventListener("click", () => {
            if (confirm(`Delete student "${student.name}" from this group?`)) {
                DataManager.deleteStudent(activeGroupId, studentIdx);
                renderGroupEditor();
                showToast("Student deleted successfully");
            }
        });
        tr.appendChild(tdDelete);

        // Stepper & Input event listeners for real-time total recalculation
        const scoreInputs = tr.querySelectorAll(".criterion-score-input");
        const totalBadge = tr.querySelector(`.total-badge-${studentIdx}`);

        function updateRowTotal() {
            let sum = 0;
            scoreInputs.forEach(input => {
                sum += Number(input.value) || 0;
            });
            totalBadge.innerText = sum;
        }

        tr.querySelectorAll(".plus-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const critIdx = btn.dataset.crit;
                const input = tr.querySelector(`.criterion-score-input[data-crit="${critIdx}"]`);
                input.value = (Number(input.value) || 0) + 1;
                updateRowTotal();
            });
        });

        tr.querySelectorAll(".minus-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const critIdx = btn.dataset.crit;
                const input = tr.querySelector(`.criterion-score-input[data-crit="${critIdx}"]`);
                const val = (Number(input.value) || 0);
                if (val > 0) input.value = val - 1;
                updateRowTotal();
            });
        });

        scoreInputs.forEach(input => {
            input.addEventListener("input", updateRowTotal);
        });

        tbody.appendChild(tr);
    });
}

function handleAddStudent() {
    const name = prompt("Enter new student name:");
    if (!name || !name.trim()) return;

    const group = DataManager.getGroup(activeGroupId);
    if (!group) return;

    const initialScores = new Array(group.criteria.length).fill(0);
    DataManager.addStudent(activeGroupId, name.trim(), initialScores);
    renderGroupEditor();
    showToast(`Student "${name.trim()}" added successfully! ⭐`);
}

function handleSaveAllChanges() {
    const group = DataManager.getGroup(activeGroupId);
    if (!group) return;

    const tbody = document.getElementById("students-table-body");
    const rows = Array.from(tbody.querySelectorAll("tr[data-student-index]"));

    const updatedStudents = [];

    rows.forEach(row => {
        const nameInput = row.querySelector(".student-name-input");
        const name = nameInput ? nameInput.value.trim() : "Student";

        const scoreInputs = Array.from(row.querySelectorAll(".criterion-score-input"));
        const scores = scoreInputs.map(input => Number(input.value) || 0);
        const total = scores.reduce((sum, val) => sum + val, 0);

        updatedStudents.push({
            name: name,
            scores: scores,
            total: total
        });
    });

    DataManager.updateGroup(activeGroupId, { students: updatedStudents });
    renderGroupEditor();
    showToast("All changes and student grades saved successfully! 🎉");
}

/* ========================================================
   EXCEL EXPORT & IMPORT (SheetJS)
   ======================================================== */

// 1. Export All Groups to a Multi-Sheet Excel Workbook
function exportAllGroupsToExcel() {
    if (typeof XLSX === "undefined") {
        alert("Notice: Excel library is still loading, please try again in a moment.");
        return;
    }

    const wb = XLSX.utils.book_new();
    const groups = DataManager.getAllGroups();

    groups.forEach((group) => {
        const sortedStudents = [...group.students].sort((a, b) => b.total - a.total);
        const headers = ["Rank", "Student Name", ...group.criteria, "Total 🏆"];

        const rows = sortedStudents.map((s, idx) => [
            idx + 1,
            s.name,
            ...s.scores,
            s.total
        ]);

        const sheetData = [
            [`Grade Sheet: ${group.title}`],
            [],
            headers,
            ...rows
        ];

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 14 }];

        let safeSheetName = `Group_${group.id}`;
        XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Future_Academy_All_Groups_${dateStr}.xlsx`);
    showToast("All groups exported to Excel successfully! 📊");
}

// 2. Export Current Active Group
function exportActiveGroupToExcel() {
    if (typeof XLSX === "undefined") return;

    const group = DataManager.getGroup(activeGroupId);
    if (!group) return;

    const wb = XLSX.utils.book_new();
    const sortedStudents = [...group.students].sort((a, b) => b.total - a.total);
    const headers = ["Rank", "Student Name", ...group.criteria, "Total 🏆"];

    const rows = sortedStudents.map((s, idx) => [
        idx + 1,
        s.name,
        ...s.scores,
        s.total
    ]);

    const sheetData = [
        [`Grade Sheet: ${group.title}`],
        [],
        headers,
        ...rows
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 14 }];

    XLSX.utils.book_append_sheet(wb, ws, `Group_${group.id}`);
    XLSX.writeFile(wb, `Future_Academy_Group_${group.id}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast(`Group ${group.id} exported to Excel successfully! 📊`);
}

// 3. Download Empty Excel Template
function downloadExcelTemplate() {
    if (typeof XLSX === "undefined") return;

    const group = DataManager.getGroup(activeGroupId) || { criteria: ["Attendance 📅", "Tasks 📝", "Participation ⭐"] };
    const wb = XLSX.utils.book_new();

    const headers = ["Rank", "Student Name", ...group.criteria, "Total 🏆"];
    const sampleRows = [
        [1, "Ahmed Mohamed", 10, 20, 10, 40],
        [2, "Mariam Ali", 10, 18, 9, 37]
    ];

    const sheetData = [
        ["Student Grades Template - Future Academy"],
        ["Note: Enter student names and scores, then import the file into the dashboard."],
        headers,
        ...sampleRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 14 }];

    XLSX.utils.book_append_sheet(wb, ws, "Scores_Template");
    XLSX.writeFile(wb, "Future_Academy_Template.xlsx");
    showToast("Excel template downloaded! 📄");
}

// 4. Import from Excel File (.xlsx, .xls, .csv)
function importExcelFile(file) {
    if (typeof XLSX === "undefined") {
        alert("Excel library is not loaded!");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            if (!workbook || workbook.SheetNames.length === 0) {
                throw new Error("Excel file is empty or invalid!");
            }

            let importedGroupsCount = 0;
            const existingGroups = DataManager.getAllGroups();

            workbook.SheetNames.forEach(sheetName => {
                const ws = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
                if (!rows || rows.length < 2) return;

                // Find header row (row containing 'name' or criteria)
                let headerRowIdx = -1;
                for (let r = 0; r < rows.length; r++) {
                    const rowStr = (rows[r] || []).join(" ").toLowerCase();
                    if (/name|student|pos|rank|attendance|task/i.test(rowStr)) {
                        headerRowIdx = r;
                        break;
                    }
                }

                if (headerRowIdx === -1) headerRowIdx = 0;

                const headerRow = rows[headerRowIdx] || [];

                // Find column index for student name
                let nameColIdx = -1;
                for (let c = 0; c < headerRow.length; c++) {
                    const cellVal = String(headerRow[c] || "").toLowerCase();
                    if (/name|student/i.test(cellVal)) {
                        nameColIdx = c;
                        break;
                    }
                }
                if (nameColIdx === -1) nameColIdx = headerRow.length > 1 ? 1 : 0;

                // Match with target group
                let targetGroup = null;
                const matchGroupId = sheetName.match(/group[_\s]*(\d+)/i) || sheetName.match(/^(\d+)$/);
                if (matchGroupId && matchGroupId[1]) {
                    targetGroup = DataManager.getGroup(parseInt(matchGroupId[1], 10));
                }

                if (!targetGroup) {
                    if (workbook.SheetNames.length === 1) {
                        targetGroup = DataManager.getGroup(activeGroupId);
                    } else {
                        targetGroup = existingGroups.find(g => sheetName.toLowerCase().includes(String(g.id)));
                    }
                }

                if (!targetGroup) {
                    targetGroup = DataManager.getGroup(activeGroupId);
                }

                if (!targetGroup) return;

                // Parse students from rows below header
                const parsedStudents = [];
                for (let r = headerRowIdx + 1; r < rows.length; r++) {
                    const rowData = rows[r];
                    if (!rowData || rowData.length === 0) continue;

                    const studentName = String(rowData[nameColIdx] || "").trim();
                    if (!studentName || /example|total|template|grade sheet/i.test(studentName)) continue;

                    // Collect score columns
                    const scores = [];
                    targetGroup.criteria.forEach((crit, critIdx) => {
                        const colIdx = nameColIdx + 1 + critIdx;
                        let val = Number(rowData[colIdx]);
                        if (isNaN(val)) val = 0;
                        scores.push(val);
                    });

                    const total = scores.reduce((sum, v) => sum + v, 0);

                    parsedStudents.push({
                        name: studentName,
                        scores: scores,
                        total: total
                    });
                }

                if (parsedStudents.length > 0) {
                    DataManager.updateGroup(targetGroup.id, { students: parsedStudents });
                    importedGroupsCount++;
                }
            });

            renderGroupsTabs();
            renderGroupEditor();
            showToast(`Successfully imported ${importedGroupsCount} group(s) from Excel! 📊🎉`);
        } catch (err) {
            console.error("Excel import error:", err);
            alert("Error reading Excel file: " + err.message);
        }
    };

    reader.readAsArrayBuffer(file);
}

function handleResetDefaults() {
    if (confirm("Are you sure you want to restore default data? Any unsaved changes in Excel will be lost.")) {
        DataManager.resetToDefaults();
        activeGroupId = 1;
        renderGroupsTabs();
        renderGroupEditor();
        showToast("Default data restored successfully!");
    }
}

function setupPinModal() {
    const modal = document.getElementById("pin-modal");
    const openBtn = document.getElementById("btn-change-pin");
    const cancelBtn = document.getElementById("btn-cancel-pin");
    const confirmBtn = document.getElementById("btn-confirm-pin");
    const input = document.getElementById("new-pin-input");

    openBtn.addEventListener("click", () => {
        input.value = "";
        modal.style.display = "flex";
        input.focus();
    });

    cancelBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    confirmBtn.addEventListener("click", () => {
        const val = input.value.trim();
        try {
            DataManager.setPin(val);
            modal.style.display = "none";
            showToast("Security PIN changed successfully! 🔑");
        } catch (err) {
            alert(err.message);
        }
    });
}

function showToast(msg) {
    const toast = document.getElementById("admin-toast");
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str || "";
    return div.innerHTML;
}
