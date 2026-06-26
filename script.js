document.addEventListener('DOMContentLoaded', () => {
    const subjectsContainer = document.getElementById('subjectsContainer');
    const addSubBtn = document.getElementById('addSubBtn');
    const resultForm = document.getElementById('resultForm');
    const printBtn = document.getElementById('printBtn');
    const resultCard = document.getElementById('resultCard');

    let subjectCount = 0;

    function addSubjectRow() {
        subjectCount++;
        const row = document.createElement('div');
        row.className = 'subject-row';
        row.innerHTML = `
            <div>
                <label class="sr-only" style="display:none;">Subject Name</label>
                <input type="text" name="subjectName[]" placeholder="Subject Name (e.g. Math)" required>
            </div>
            <div>
                <label class="sr-only" style="display:none;">Internal</label>
                <input type="number" name="internalMarks[]" placeholder="Internal / 20" min="0" max="20" required>
            </div>
            <div>
                <label class="sr-only" style="display:none;">Theory</label>
                <input type="number" name="theoryMarks[]" placeholder="Theory / 80" min="0" max="80" required>
            </div>
            <button type="button" class="btn-remove" title="Remove Subject">×</button>
        `;

        // Remove button event
        row.querySelector('.btn-remove').addEventListener('click', () => {
            row.remove();
        });

        subjectsContainer.appendChild(row);
    }

    // Add initial rows (e.g., 5 standard subjects)
    const initialSubjects = ['English', 'Mathematics', 'Science', 'Social Studies', 'Computer'];
    initialSubjects.forEach(sub => {
        addSubjectRow();
        const lastRow = subjectsContainer.lastElementChild;
        lastRow.querySelector('input[name="subjectName[]"]').value = sub;
    });

    addSubBtn.addEventListener('click', addSubjectRow);

    resultForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Gather Data
        const schoolName = document.getElementById('schoolName').value;
        const schoolAddress = document.getElementById('schoolAddress').value;
        const studentName = document.getElementById('studentName').value;
        const fatherName = document.getElementById('fatherName').value;
        const className = document.getElementById('className').value;
        const sectionName = document.getElementById('sectionName').value;

        // Display Header & Info
        document.getElementById('displaySchoolName').textContent = schoolName;
        document.getElementById('displaySchoolAddress').textContent = schoolAddress;
        document.getElementById('displayStudentName').textContent = studentName;
        document.getElementById('displayFatherName').textContent = fatherName;
        document.getElementById('displayClass').textContent = className;
        document.getElementById('displaySection').textContent = sectionName;

        // Process Marks
        const subjectNames = document.querySelectorAll('input[name="subjectName[]"]');
        const internals = document.querySelectorAll('input[name="internalMarks[]"]');
        const theories = document.querySelectorAll('input[name="theoryMarks[]"]');
        
        const marksTableBody = document.getElementById('marksTableBody');
        marksTableBody.innerHTML = '';

        let grandTotal = 0;
        let maxTotalMarks = subjectNames.length * 100;
        let hasFailedSubject = false;

        for (let i = 0; i < subjectNames.length; i++) {
            const sub = subjectNames[i].value;
            const internal = parseFloat(internals[i].value) || 0;
            const theory = parseFloat(theories[i].value) || 0;
            const total = internal + theory;
            grandTotal += total;

            // Determine passing for individual subject (Assuming 33/100 is pass)
            const remarks = total >= 33 ? 'Pass' : 'Fail';
            if (remarks === 'Fail') hasFailedSubject = true;

            let grade = 'E';
            if(total >= 91) grade = 'A1';
            else if(total >= 81) grade = 'A2';
            else if(total >= 71) grade = 'B1';
            else if(total >= 61) grade = 'B2';
            else if(total >= 51) grade = 'C1';
            else if(total >= 41) grade = 'C2';
            else if(total >= 33) grade = 'D';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${sub}</td>
                <td>${internal}</td>
                <td>${theory}</td>
                <td><strong>${total}</strong></td>
                <td><strong>${grade}</strong></td>
                <td style="color: ${remarks === 'Pass' ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">${remarks}</td>
            `;
            marksTableBody.appendChild(tr);
        }

        // Calculate Overall
        const percentage = (grandTotal / maxTotalMarks) * 100;
        const overallStatus = (!hasFailedSubject && percentage >= 33) ? 'PASS' : 'FAIL';

        document.getElementById('displayTotalMarks').textContent = `${grandTotal} / ${maxTotalMarks}`;
        document.getElementById('displayPercentage').textContent = percentage.toFixed(2) + '%';
        
        const statusEl = document.getElementById('displayStatus');
        statusEl.textContent = overallStatus;
        statusEl.className = 'summary-value ' + (overallStatus === 'PASS' ? 'status-pass' : 'status-fail');

        // Show Result Card & Enable Print
        resultCard.classList.remove('hidden');
        printBtn.disabled = false;
        
        // Scroll to result on mobile
        if (window.innerWidth < 1024) {
            resultCard.scrollIntoView({ behavior: 'smooth' });
        }
    });

    printBtn.addEventListener('click', () => {
        window.print();
    });
});
