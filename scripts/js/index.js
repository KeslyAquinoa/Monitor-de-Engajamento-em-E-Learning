const consentBox = document.getElementById('consentBox')
const consent = document.getElementById('checkbox')
const studentBtn = document.getElementById('studentBtn')
const teacherBtn = document.getElementById('teacherBtn')
const errorMessage = document.getElementById('error-message')

// Quando clica em 'Sou Aluno'
studentBtn.addEventListener('click', () => {

    // Mostra a caixa de consentimento
    consentBox.style.display = 'block'

    // Escuta quando marcar o checkbox
    consent.addEventListener('change', () => {
        if (consent.checked) {
            window.location.href = 'student_session.html'
        } else {
            errorMessage.textContent = 'Por favor, autorize o uso da webcam para prosseguir.'
        }
    }) 

})

// Quando clica em 'Sou Professor'
teacherBtn.addEventListener('click', () => {
    window.location.href = 'teacher_dashboard.html'
})
