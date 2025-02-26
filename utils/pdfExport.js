import jsPDF from 'jspdf';

export const exportToPDF = (tasks) => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Tasks Report', 20, 20);
    
    let yPos = 40;
    tasks.forEach((task, index) => {
        doc.setFontSize(12);
        doc.text(`${index + 1}. ${task.title}`, 20, yPos);
        doc.setFontSize(10);
        doc.text(`Due: ${task.dueDate}`, 25, yPos + 7);
        doc.text(`Status: ${task.status}`, 25, yPos + 14);
        yPos += 30;
        
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
    });
    
    doc.save('tasks-report.pdf');
};
