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

            // Curso 1: Sin semestres, solo cursos
            if (year.year === 1) {
                const coursesDiv = document.createElement('div');
                coursesDiv.className = 'courses';
                year.courses.forEach(course => {
                    const courseDiv = document.createElement('div');
                    courseDiv.className = 'course';
                    courseDiv.innerHTML = `${course.name} (${course.credits} créditos)`;

                    const courseKey = `1-0-${course.name}`;
                    if (completedCourses[courseKey]) {
                        courseDiv.classList.add('completed');
                    }

                    courseDiv.addEventListener('click', () => {
                        courseDiv.classList.toggle('completed');
                        completedCourses[courseKey] = courseDiv.classList.contains('completed');
                        localStorage.setItem('completedCourses', JSON.stringify(completedCourses));
                        updateFutureYears(years, completedCourses, year.year);
                    });

                    coursesDiv.appendChild(courseDiv);
                });
                yearDiv.appendChild(coursesDiv);
            } else {
                // Cursos 2, 3, 4: Con semestres
                year.semesters.forEach((semester, semesterIndex) => {
                    const semesterDiv = document.createElement('div');
                    semesterDiv.className = 'semester';
                    semesterDiv.innerHTML = `<h3>${semester.name}</h3>`;

                    const isYearUnlocked = checkYearUnlocked(years, year.year, completedCourses);

                    semester.courses.forEach(course => {
                        const courseDiv = document.createElement('div');
                        courseDiv.className = 'course';
                        courseDiv.innerHTML = `${course.name} (${course.credits} créditos)`;

                        const courseKey = `${year.year}-${semesterIndex}-${course.name}`;
                        if (completedCourses[courseKey]) {
                            courseDiv.classList.add('completed');
                        }

                        if (!isYearUnlocked) {
                            courseDiv.classList.add('locked');
                        } else {
                            courseDiv.addEventListener('click', () => {
                                if (!courseDiv.classList.contains('locked')) {
                                    courseDiv.classList.toggle('completed');
                                    completedCourses[courseKey] = courseDiv.classList.contains('completed');
                                    localStorage.setItem('completedCourses', JSON.stringify(completedCourses));
                                    updateFutureYears(years, completedCourses, year.year);
                                }
                            });
                        }

                        semesterDiv.appendChild(courseDiv);
                    });

                    yearDiv.appendChild(semesterDiv);
                });
            }

            curriculumDiv.appendChild(yearDiv);
        });
    }

    function checkYearUnlocked(years, currentYear, completedCourses) {
        if (currentYear === 1) return true;

        const previousYear = years.find(y => y.year === currentYear - 1);
        if (!previousYear) return false;

        let previousCourses = [];
        if (currentYear === 2) {
            // Curso 1 tiene cursos directamente
            previousCourses = previousYear.courses;
        } else {
            // Otros cursos tienen semestres
            previousCourses = previousYear.semesters.flatMap(semester => semester.courses);
        }

        return previousCourses.every(course => {
            const courseKey = currentYear === 2 ? `1-0-${course.name}` : `${currentYear - 1}-${previousYear.semesters.findIndex(s => s.courses.includes(course))}-${course.name}`;
            return completedCourses[courseKey];
        });
    }

    function updateFutureYears(years, completedCourses, currentYear) {
        const allCourses = document.querySelectorAll('.course');
        allCourses.forEach(courseDiv => {
            const courseKey = courseDiv.textContent.split(' (')[0];
            const year = parseInt(courseDiv.parentElement.parentElement.querySelector('h2').textContent.match(/\d+/)[0]);
            const semesterIndex = courseDiv.parentElement.classList.contains('courses') ? 0 : (courseDiv.parentElement.querySelector('h3').textContent.includes('Semestre 1') ? 0 : 1);

            // Solo actualiza cursos futuros
            if (year > currentYear) {
                if (!checkYearUnlocked(years, year, completedCourses)) {
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