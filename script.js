document.addEventListener('DOMContentLoaded', () => {
    fetch('courses.json')
        .then(response => response.json())
        .then(data => initializeCurriculum(data))
        .catch(error => console.error('Error cargando los cursos:', error));

    function initializeCurriculum(years) {
        const curriculumDiv = document.getElementById('curriculum');
        let completedCourses = JSON.parse(localStorage.getItem('completedCourses')) || {};

        years.forEach(year => {
            const yearDiv = document.createElement('div');
            yearDiv.className = 'year';
            yearDiv.innerHTML = `<h2>Curso ${year.year}</h2>`;

            year.semesters.forEach((semester, semesterIndex) => {
                const semesterDiv = document.createElement('div');
                semesterDiv.className = 'semester';
                semesterDiv.innerHTML = `<h3>${semester.name}</h3>`;

                const isSemesterUnlocked = checkSemesterUnlocked(years, year.year, semesterIndex, completedCourses);

                semester.courses.forEach(course => {
                    const courseDiv = document.createElement('div');
                    courseDiv.className = 'course';
                    courseDiv.innerHTML = `${course.name} (${course.credits} créditos)`;

                    const courseKey = `${year.year}-${semesterIndex}-${course.name}`;
                    if (completedCourses[courseKey]) {
                        courseDiv.classList.add('completed');
                    }

                    if (!isSemesterUnlocked) {
                        courseDiv.classList.add('locked');
                    } else {
                        courseDiv.addEventListener('click', () => {
                            if (!courseDiv.classList.contains('locked')) {
                                courseDiv.classList.toggle('completed');
                                completedCourses[courseKey] = courseDiv.classList.contains('completed');
                                localStorage.setItem('completedCourses', JSON.stringify(completedCourses));
                                updateFutureSemesters(years, completedCourses, year.year, semesterIndex);
                            }
                        });
                    }

                    semesterDiv.appendChild(courseDiv);
                });

                yearDiv.appendChild(semesterDiv);
            });

            curriculumDiv.appendChild(yearDiv);
        });
    }

    function checkSemesterUnlocked(years, currentYear, currentSemesterIndex, completedCourses) {
        if (currentYear === 1 && currentSemesterIndex === 0) return true;

        let previousCourses = [];
        if (currentSemesterIndex === 0) {
            const previousYear = years.find(y => y.year === currentYear - 1);
            if (previousYear) {
                previousCourses = previousYear.semesters[1].courses;
            }
        } else {
            previousCourses = years.find(y => y.year === currentYear).semesters[0].courses;
        }

        return previousCourses.every(course => {
            const courseKey = `${currentYear - (currentSemesterIndex === 0 ? 1 : 0)}-${currentSemesterIndex === 0 ? 1 : 0}-${course.name}`;
            return completedCourses[courseKey];
        });
    }

    function updateFutureSemesters(years, completedCourses, currentYear, currentSemesterIndex) {
        const allCourses = document.querySelectorAll('.course');
        allCourses.forEach(courseDiv => {
            const courseKey = courseDiv.textContent.split(' (')[0];
            const [year, semesterIndex] = courseDiv.parentElement.parentElement.querySelector('h2').textContent.match(/\d+/)[0] + '-' + (courseDiv.parentElement.querySelector('h3').textContent.includes('Semestre 1') ? 0 : 1);
            
            // Solo actualiza semestres futuros, no el semestre actual
            if (parseInt(year) > currentYear || (parseInt(year) === currentYear && parseInt(semesterIndex) > currentSemesterIndex)) {
                if (!checkSemesterUnlocked(years, parseInt(year), parseInt(semesterIndex), completedCourses)) {
                    courseDiv.classList.add('locked');
                    courseDiv.style.pointerEvents = 'none';
                } else {
                    courseDiv.classList.remove('locked');
                    courseDiv.style.pointerEvents = 'auto';
                }
            }
        });
    }
});