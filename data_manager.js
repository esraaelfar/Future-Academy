/**
 * Future Academy - Centralized Data Manager
 * Handles local storage persistence, coach PIN authentication,
 * and real-time synchronization of groups, students, criteria, and scores.
 */

const STORAGE_KEY = "future_academy_scoreboard_v2";
const PIN_KEY = "future_academy_coach_pin";
const DEFAULT_PIN = "1234";

const DEFAULT_ACADEMY_DATA = {
    groups: [
        {
            id: 1,
            title: "Arduino Code Friday 1:3",
            criteria: ["Attendance 📅", "Tasks 📝", "Participation ⭐"],
            students: [
                { name: "Moaz", scores: [10, 18, 10], total: 38 },
                { name: "Yahia", scores: [10, 12, 6], total: 28 },
                { name: "Ali", scores: [8, 10, 5], total: 23 }
            ]
        },
        {
            id: 2,
            title: "Python For AI Saturday 5:30-7:30",
            criteria: ["Attendance 📅", "Tasks 📝", "Participation ⭐"],
            students: [
                { name: "Judy", scores: [10, 20, 10], total: 40 },
                { name: "Aisha", scores: [10, 20, 10], total: 40 },
                { name: "Adam", scores: [10, 20, 10], total: 40 },
                { name: "Ziad", scores: [10, 15, 5], total: 30 },
                { name: "Abdelrahman", scores: [10, 10, 0], total: 20 },
                { name: "Maged", scores: [5, 5, 0], total: 10 }
            ]
        },
        {
            id: 3,
            title: "AI Thursday 6:30-8:30",
            criteria: ["Attendance 📅", "Tasks 📝", "Participation ⭐"],
            students: [
                { name: "Malak", scores: [10, 15, 10], total: 35 },
                { name: "Mohmed El_Nashar", scores: [10, 10, 5], total: 25 },
                { name: "Nagy Ashour", scores: [8, 10, 4], total: 22 }
            ]
        },
        {
            id: 4,
            title: "Arduino Code 5:00-7:00",
            criteria: ["Attendance 📅", "Tasks 📝", "Participation ⭐"],
            students: [
                { name: "Rahma", scores: [10, 20, 10], total: 40 },
                { name: "Toqi", scores: [10, 15, 8], total: 33 },
                { name: "Anas", scores: [10, 10, 5], total: 25 },
                { name: "Omar", scores: [8, 8, 4], total: 20 },
                { name: "Hossam", scores: [6, 5, 2], total: 13 }
            ]
        },
        {
            id: 5,
            title: "Arduino Code Saturday 3:30 - 5:30",
            criteria: ["Attendance 📅", "Tasks 📝", "Participation ⭐"],
            students: [
                { name: "Rodina", scores: [10, 24, 10], total: 44 },
                { name: "Sherif", scores: [10, 14, 6], total: 30 },
                { name: "Malek", scores: [10, 10, 5], total: 25 },
                { name: "Mazen", scores: [8, 8, 4], total: 20 },
                { name: "Mohamed", scores: [6, 6, 2], total: 14 }
            ]
        },
        {
            id: 6,
            title: "Arduino Code Friday 2:30 - 4:30",
            criteria: ["Attendance 📅", "Tasks 📝", "Participation ⭐"],
            students: [
                { name: "Akram", scores: [10, 15, 5], total: 30 },
                { name: "Eyad", scores: [10, 12, 6], total: 28 },
                { name: "Saed", scores: [10, 10, 5], total: 25 },
                { name: "Mohamed shams", scores: [8, 8, 4], total: 20 },
                { name: "Youssef", scores: [8, 6, 4], total: 18 },
                { name: "Mohamed Soudi", scores: [6, 5, 2], total: 13 }
            ]
        }
    ]
};

const DataManager = {
    // PIN Authentication
    getPin() {
        return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
    },

    setPin(newPin) {
        if (!newPin || newPin.trim().length < 4) {
            throw new Error("يجب أن تتكون كلمة السر من 4 أرقام على الأقل");
        }
        localStorage.setItem(PIN_KEY, newPin.trim());
        return true;
    },

    verifyPin(pin) {
        return (pin || "").trim() === this.getPin();
    },

    isCoachLoggedIn() {
        return sessionStorage.getItem("coach_logged_in") === "true";
    },

    isEngineerLoggedIn() {
        return this.isCoachLoggedIn();
    },

    loginCoach(pin) {
        if (this.verifyPin(pin)) {
            sessionStorage.setItem("coach_logged_in", "true");
            return true;
        }
        return false;
    },

    loginEngineer(pin) {
        return this.loginCoach(pin);
    },

    logoutCoach() {
        sessionStorage.removeItem("coach_logged_in");
    },

    logoutEngineer() {
        this.logoutCoach();
    },

    // Data Load & Save
    getData() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                this.saveData(DEFAULT_ACADEMY_DATA);
                return JSON.parse(JSON.stringify(DEFAULT_ACADEMY_DATA));
            }
            const parsed = JSON.parse(raw);
            if (!parsed.groups || !Array.isArray(parsed.groups)) {
                return JSON.parse(JSON.stringify(DEFAULT_ACADEMY_DATA));
            }
            return parsed;
        } catch (e) {
            console.error("Error reading scoreboard data:", e);
            return JSON.parse(JSON.stringify(DEFAULT_ACADEMY_DATA));
        }
    },

    saveData(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            // Trigger storage event for cross-tab sync
            window.dispatchEvent(new Event("scoreboard_data_updated"));
            return true;
        } catch (e) {
            console.error("Error saving scoreboard data:", e);
            return false;
        }
    },

    resetToDefaults() {
        this.saveData(DEFAULT_ACADEMY_DATA);
        return JSON.parse(JSON.stringify(DEFAULT_ACADEMY_DATA));
    },

    // Group Management
    getAllGroups() {
        return this.getData().groups || [];
    },

    getGroup(id) {
        const groups = this.getAllGroups();
        return groups.find(g => Number(g.id) === Number(id)) || null;
    },

    addGroup(title, criteria = ["Attendance 📅", "Tasks 📝", "Participation ⭐"]) {
        const data = this.getData();
        const maxId = data.groups.reduce((max, g) => Math.max(max, Number(g.id) || 0), 0);
        const newGroup = {
            id: maxId + 1,
            title: title || `Group ${maxId + 1}`,
            criteria: criteria,
            students: []
        };
        data.groups.push(newGroup);
        this.saveData(data);
        return newGroup;
    },

    updateGroup(id, updatedFields) {
        const data = this.getData();
        const groupIndex = data.groups.findIndex(g => Number(g.id) === Number(id));
        if (groupIndex === -1) return null;

        data.groups[groupIndex] = {
            ...data.groups[groupIndex],
            ...updatedFields
        };
        this.saveData(data);
        return data.groups[groupIndex];
    },

    deleteGroup(id) {
        const data = this.getData();
        if (data.groups.length <= 1) {
            throw new Error("لا يمكن حذف المجموعة الوحيدة المتبقية!");
        }
        data.groups = data.groups.filter(g => Number(g.id) !== Number(id));
        this.saveData(data);
        return true;
    },

    // Student Management inside a Group
    addStudent(groupId, name, scores = []) {
        const data = this.getData();
        const group = data.groups.find(g => Number(g.id) === Number(groupId));
        if (!group) return null;

        const criteriaCount = group.criteria.length;
        const validScores = [];
        for (let i = 0; i < criteriaCount; i++) {
            validScores.push(Number(scores[i]) || 0);
        }
        const total = validScores.reduce((sum, val) => sum + val, 0);

        const newStudent = {
            name: (name || "New Student").trim(),
            scores: validScores,
            total: total
        };

        group.students.push(newStudent);
        this.saveData(data);
        return newStudent;
    },

    updateStudent(groupId, studentIndex, updatedData) {
        const data = this.getData();
        const group = data.groups.find(g => Number(g.id) === Number(groupId));
        if (!group || !group.students[studentIndex]) return null;

        const current = group.students[studentIndex];
        const name = updatedData.name !== undefined ? updatedData.name.trim() : current.name;
        const scores = updatedData.scores !== undefined ? updatedData.scores : current.scores;
        const total = scores.reduce((sum, val) => sum + (Number(val) || 0), 0);

        group.students[studentIndex] = {
            name: name,
            scores: scores.map(s => Number(s) || 0),
            total: total
        };

        this.saveData(data);
        return group.students[studentIndex];
    },

    deleteStudent(groupId, studentIndex) {
        const data = this.getData();
        const group = data.groups.find(g => Number(g.id) === Number(groupId));
        if (!group || !group.students[studentIndex]) return false;

        group.students.splice(studentIndex, 1);
        this.saveData(data);
        return true;
    },

    // Export & Import
    exportJSON() {
        return JSON.stringify(this.getData(), null, 2);
    },

    importJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (!parsed.groups || !Array.isArray(parsed.groups)) {
                throw new Error("تنسيق البيانات غير صحيح!");
            }
            this.saveData(parsed);
            return true;
        } catch (e) {
            throw new Error("فشل استيراد البيانات: " + e.message);
        }
    }
};

// Make available globally
if (typeof window !== "undefined") {
    window.DataManager = DataManager;
}
