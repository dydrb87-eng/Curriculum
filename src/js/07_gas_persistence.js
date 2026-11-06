    // CRITERIA ACADEMIC YEAR (상위: 기준 학년도) HANDLERS
    // ==========================================

    window.switchAcademicYearGroup = function(targetAcadYear) {
      if (!targetAcadYear || targetAcadYear === MultiState.activeAcademicYear) return;

      // 1. 현재 학년도의 작업 내용(AppState)을 MultiState.data에 먼저 동기화
      if (MultiState.activeGrade !== '전체') {
        syncCurrentToMulti();
      }

      // 2. 현재 학년도의 날짜 목록(yearsList)을 datesByAcademicYear에 보존
      const prevAY = MultiState.activeAcademicYear;
      if (prevAY) {
        if (!MultiState.datesByAcademicYear) MultiState.datesByAcademicYear = {};
        MultiState.datesByAcademicYear[prevAY] = [...MultiState.yearsList];
      }

      // 3. 대상 학년도로 전환
      MultiState.activeAcademicYear = targetAcadYear;

      // 4. 대상 학년도의 날짜 목록 로드
      if (!MultiState.datesByAcademicYear) MultiState.datesByAcademicYear = {};
      if (!MultiState.datesByAcademicYear[targetAcadYear] || MultiState.datesByAcademicYear[targetAcadYear].length === 0) {
        const baseDate = targetAcadYear.replace(/[^0-9]/g, '') + '.10.11.';
        MultiState.datesByAcademicYear[targetAcadYear] = [baseDate];
      }

      MultiState.yearsList = [...MultiState.datesByAcademicYear[targetAcadYear]];
      const targetDate = MultiState.yearsList[0];

      // 5. 대상 학년도의 첫 번째 날짜 컨텍스트로 전환 (shouldSave=false: 이미 1단계에서 저장 완료됨)
      switchAcademicContext(targetDate, MultiState.activeGrade, false);
      saveAllState();
      renderYearGradeNav();
    };

    window.handleAddAcademicYearGroup = function() {
      // 기존에 존재하는 학년도들 중 최대 연도 + 1년 자동 계산 (예: 2027학년도 -> 2028학년도)
      const existingNumeric = (MultiState.academicYearsList || [])
        .map(y => parseInt(String(y).replace(/[^0-9]/g, ''), 10))
        .filter(n => !isNaN(n) && n > 2000);
      const maxYear = existingNumeric.length > 0 ? Math.max(...existingNumeric) : new Date().getFullYear();
      const suggestYear = String(maxYear + 1) + '학년도';

      const input = prompt('추가할 새 기준 학년도를 입력하세요:\n(예: 2028학년도, 2027학년도 등)', suggestYear);
      if (!input) return;
      const acadYear = input.trim();
      if (!acadYear) return;

      if (!MultiState.academicYearsList) MultiState.academicYearsList = ['2027학년도'];
      if (MultiState.academicYearsList.includes(acadYear)) {
        alert(`이미 존재하는 기준 학년도입니다: ${acadYear}`);
        return;
      }

      // 현재 학년도 날짜 목록 및 상태 먼저 동기화
      if (MultiState.activeGrade !== '전체') {
        syncCurrentToMulti();
      }
      const prevAcadYear = MultiState.activeAcademicYear;
      if (prevAcadYear) {
        if (!MultiState.datesByAcademicYear) MultiState.datesByAcademicYear = {};
        MultiState.datesByAcademicYear[prevAcadYear] = [...MultiState.yearsList];
      }

      MultiState.academicYearsList.push(acadYear);
      if (!MultiState.datesByAcademicYear) MultiState.datesByAcademicYear = {};
      const baseDate = acadYear.replace(/[^0-9]/g, '') + '.10.11.';
      MultiState.datesByAcademicYear[acadYear] = [baseDate];

      // 새 학년도의 첫 날짜 기본 데이터 객체 초기화 (완전 격리 구조)
      const newAcadData = getAcadData(acadYear);
      if (!newAcadData[baseDate]) {
        newAcadData[baseDate] = {
          '2학년': createEmptyGradeState('2학년'),
          '3학년': createEmptyGradeState('3학년'),
          '전체': { curriculum: [], lastUpdated: null }
        };
      }

      // 이전 학년도의 기초데이터 복사 여부 안내
      const prevCurr = (MultiState.curriculumByAcademicYear && MultiState.curriculumByAcademicYear[prevAcadYear]) || [];

      if (!MultiState.curriculumByAcademicYear) MultiState.curriculumByAcademicYear = {};
      if (prevCurr && prevCurr.length > 0) {
        if (confirm(`💡 새 기준 학년도 [${acadYear}] 생성 안내:\n\n이전 학년도 [${prevAcadYear}]의 교육과정 기초데이터(${prevCurr.length}개 과목 및 배정 교사)를 복사해 오시겠습니까?\n\n- [확인]: 이전 학년도 편제표 및 교사 배정을 그대로 가져와 시작\n- [취소]: 빈 편제표로 시작`)) {
          MultiState.curriculumByAcademicYear[acadYear] = JSON.parse(JSON.stringify(prevCurr));
        } else {
          MultiState.curriculumByAcademicYear[acadYear] = [];
        }
      } else {
        MultiState.curriculumByAcademicYear[acadYear] = [];
      }

      window.switchAcademicYearGroup(acadYear);
    };

    window.handleEditAcademicYearGroup = function(oldAcadYear, event) {
      if (event) event.stopPropagation();
      const input = prompt(`[${oldAcadYear}]의 이름을 수정하세요:`, oldAcadYear);
      if (!input) return;
      const newAcadYear = input.trim();
      if (!newAcadYear || newAcadYear === oldAcadYear) return;

      if (MultiState.academicYearsList.includes(newAcadYear)) {
        alert(`이미 존재하는 학년도 이름입니다: ${newAcadYear}`);
        return;
      }

      MultiState.academicYearsList = MultiState.academicYearsList.map(y => y === oldAcadYear ? newAcadYear : y);
      if (MultiState.datesByAcademicYear && MultiState.datesByAcademicYear[oldAcadYear]) {
        MultiState.datesByAcademicYear[newAcadYear] = MultiState.datesByAcademicYear[oldAcadYear];
        delete MultiState.datesByAcademicYear[oldAcadYear];
      }
      if (MultiState.curriculumByAcademicYear && MultiState.curriculumByAcademicYear[oldAcadYear]) {
        MultiState.curriculumByAcademicYear[newAcadYear] = MultiState.curriculumByAcademicYear[oldAcadYear];
        delete MultiState.curriculumByAcademicYear[oldAcadYear];
      }
      if (MultiState.data && MultiState.data[oldAcadYear]) {
        MultiState.data[newAcadYear] = MultiState.data[oldAcadYear];
        delete MultiState.data[oldAcadYear];
      }
      if (MultiState.activeAcademicYear === oldAcadYear) {
        MultiState.activeAcademicYear = newAcadYear;
      }

      saveAllState();
      renderYearGradeNav();
      alert(`✅ 기준 학년도 이름이 [${newAcadYear}](으)로 변경되었습니다.`);
    };

    window.handleDeleteAcademicYearGroup = function(acadYear, event) {
      if (event) event.stopPropagation();
      if (MultiState.academicYearsList.length <= 1) {
        alert('최소 1개의 기준 학년도는 유지되어야 하므로 삭제할 수 없습니다.');
        return;
      }
      if (!confirm(`[${acadYear}] 기준 학년도와 해당 학년도 하위의 모든 날짜 탭 및 데이터가 완전히 삭제됩니다.\n정말 삭제하시겠습니까?`)) return;

      MultiState.academicYearsList = MultiState.academicYearsList.filter(y => y !== acadYear);
      delete MultiState.datesByAcademicYear[acadYear];
      delete MultiState.curriculumByAcademicYear[acadYear];
      if (MultiState.data) delete MultiState.data[acadYear];

      if (MultiState.activeAcademicYear === acadYear) {
        window.switchAcademicYearGroup(MultiState.academicYearsList[0]);
      } else {
        saveAllState();
        renderYearGradeNav();
      }
    };

function renderYearGradeNav() {
  try {
      const yearContainer = document.getElementById('academicYearTabs');
      const gradeContainer = document.getElementById('academicGradeTabs');
      const semesterContainer = document.getElementById('academicSemesterTabs');
      const stepContainer = document.getElementById('academicStepTabs');
      const gradeNavWrapper = document.getElementById('academicGradeNavWrapper');
      const semesterNavWrapper = document.getElementById('academicSemesterNavWrapper');
      const stepNavWrapper = document.getElementById('academicStepNavWrapper');
      const currentWorkText = document.getElementById('currentWorkText');

      // State Fallback & Auto-Recovery
      if (typeof MultiState === 'undefined' || !MultiState) {
        console.warn('[Auto-Recovery] MultiState is undefined in renderYearGradeNav, restoring fallback.');
        window.MultiState = {
          academicYearsList: ['2027학년도'],
          activeAcademicYear: '2027학년도',
          datesByAcademicYear: { '2027학년도': ['2027.10.11.'] },
          curriculumByAcademicYear: { '2027학년도': [] },
          yearsList: ['2027.10.11.'],
          activeYear: '2027.10.11.',
          activeGrade: '2학년',
          activeStep: 1,
          data: {}
        };
      }
      if (!Array.isArray(MultiState.academicYearsList) || MultiState.academicYearsList.length === 0) {
        MultiState.academicYearsList = ['2027학년도'];
      }
      if (!MultiState.activeAcademicYear) {
        MultiState.activeAcademicYear = MultiState.academicYearsList[0];
      }
      if (!MultiState.datesByAcademicYear) MultiState.datesByAcademicYear = {};
      if (!Array.isArray(MultiState.datesByAcademicYear[MultiState.activeAcademicYear]) || MultiState.datesByAcademicYear[MultiState.activeAcademicYear].length === 0) {
        MultiState.datesByAcademicYear[MultiState.activeAcademicYear] = ['2027.10.11.'];
      }
      if (!Array.isArray(MultiState.yearsList) || MultiState.yearsList.length === 0) {
        MultiState.yearsList = [...MultiState.datesByAcademicYear[MultiState.activeAcademicYear]];
      }
      if (!MultiState.activeYear) {
        MultiState.activeYear = MultiState.yearsList[0];
      }
      if (!MultiState.activeGrade) {
        MultiState.activeGrade = '2학년';
      }

      const isAllGrades = MultiState.activeGrade === '전체';
      const curStep = MultiState.activeStep || 1;
      const isStep3Mode = !isAllGrades && curStep === 3;
      const isLockedMode = isAllGrades || isStep3Mode;
      const curSem = (typeof AppState !== 'undefined' && AppState && AppState.currentSemester) || 1;

      if (currentWorkText) {
        try {
          if (isAllGrades) {
            currentWorkText.textContent = `${MultiState.activeYear} 전체 (전학년 교육과정 및 교사 시수)`;
          } else if (isStep3Mode) {
            currentWorkText.textContent = `${MultiState.activeYear} ${MultiState.activeGrade} · 3단계: 이수과목 검증`;
          } else {
            currentWorkText.textContent = `${MultiState.activeYear} ${MultiState.activeGrade} · ${curSem}학기 · ${curStep === 2 ? '2단계: 그룹핑' : '1단계: 매트릭스'}`;
          }
        } catch (e) {
          console.warn('Error updating currentWorkText:', e);
        }
      }

      // 0. Render Academic Year Group Tabs (상위 기준 학년도)
      try {
        const acadGroupContainer = document.getElementById('academicYearGroupTabs');
        if (acadGroupContainer) {
          acadGroupContainer.innerHTML = MultiState.academicYearsList.map(ay => {
            const isAct = (ay === MultiState.activeAcademicYear);
            return `
              <div class="inline-flex items-center rounded-lg transition-all h-[26px] ${
                isAct 
                  ? 'bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-400/40' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs font-medium'
              }">
                <button type="button" 
                        onclick="window.switchAcademicYearGroup('${ay}')"
                        class="px-2.5 py-0.5 text-xs flex items-center gap-1 focus:outline-hidden cursor-pointer"
                        title="${ay} 교육과정으로 전환">
                  <span>${ay}</span>
                </button>
                <button type="button" 
                        onclick="window.handleEditAcademicYearGroup('${ay}', event)"
                        class="px-1 py-0.5 text-[10px] opacity-70 hover:opacity-100 ${isAct ? 'hover:text-amber-200' : 'hover:text-indigo-600'} transition cursor-pointer"
                        title="${ay} 이름 수정">
                  ✏️
                </button>
                ${MultiState.academicYearsList.length > 1 ? `
                  <button type="button" 
                          onclick="window.handleDeleteAcademicYearGroup('${ay}', event)"
                          class="pr-1.5 pl-0.5 py-0.5 text-[10px] opacity-60 hover:opacity-100 ${isAct ? 'hover:text-rose-200' : 'hover:text-rose-600'} transition cursor-pointer"
                          title="${ay} 삭제">
                    ✕
                  </button>
                ` : ''}
              </div>
            `;
          }).join('');
        }
      } catch (err0) {
        console.error('Error rendering academicYearGroupTabs:', err0);
      }

      // 1. Render Reference Date Tabs (하위 기준 날짜)
      try {
        if (yearContainer) {
          yearContainer.innerHTML = MultiState.yearsList.map(y => {
            const isActive = y === MultiState.activeYear;
            const acadData = (typeof getAcadData === 'function') ? getAcadData() : {};
            const yData = acadData[y] || {};
            let totalStudents = 0;
            ['2학년', '3학년'].forEach(g => {
              if (yData[g] && yData[g].students) {
                totalStudents += yData[g].students.length;
              }
            });

            return `
              <div class="inline-flex items-center rounded-lg transition-all select-none h-[26px] ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-xs font-bold ring-2 ring-blue-400/40' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs font-medium'
              }"
              draggable="true"
              data-year="${(typeof escapeHtml === 'function') ? escapeHtml(y) : y}"
              style="cursor: grab;"
              title="드래그하여 탭 순서를 변경할 수 있습니다">
                <span class="pl-2 pr-0.5 text-xs select-none opacity-40 hover:opacity-100 cursor-grab" title="드래그하여 순서 변경">⋮⋮</span>
                <button type="button" 
                        draggable="false"
                        onclick="window.switchAcademicContext('${y}', '${MultiState.activeGrade}')"
                        class="px-2 py-0.5 text-xs flex items-center gap-1.5 focus:outline-hidden cursor-pointer"
                        title="${y} 작업으로 전환">
                  <span>${y}</span>
                  <span class="text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white text-blue-700 shadow-2xs' : 'bg-slate-100 text-slate-500'
                  }">
                    ${totalStudents}명
                  </span>
                </button>
                
                <button type="button" 
                        draggable="false"
                        onclick="window.handleEditAcademicYear('${y}', event)"
                        class="px-1 py-1 text-[11px] opacity-70 hover:opacity-100 ${isActive ? 'hover:text-amber-200' : 'hover:text-blue-600'} transition cursor-pointer"
                        title="${y} 이름 수정">
                  ✏️
                </button>

                ${MultiState.yearsList.length > 1 ? `
                  <button type="button" 
                          draggable="false"
                          onclick="window.handleDeleteAcademicYear('${y}', event)"
                          class="pr-2 pl-0.5 py-1 text-xs opacity-60 hover:opacity-100 ${isActive ? 'hover:text-rose-200' : 'hover:text-rose-600'} transition cursor-pointer"
                          title="${y} 및 해당 데이터 삭제">
                    ✕
                  </button>
                ` : ''}
              </div>
            `;
          }).join('');
        }
      } catch (err1) {
        console.error('Error rendering academicYearTabs:', err1);
      }

      // 2. Render Grade Tabs (2학년 / 3학년 2행) - 항상 클릭 가능하며, 클릭 시 1·2학기 및 1·2단계가 다시 활성화됨
      try {
        if (gradeNavWrapper) {
          gradeNavWrapper.classList.remove('opacity-40', 'pointer-events-none', 'select-none', 'cursor-not-allowed');
          gradeNavWrapper.title = '';
        }

        if (gradeContainer) {
          const acadData = (typeof getAcadData === 'function') ? getAcadData() : {};
          const yData = acadData[MultiState.activeYear] || {};

          gradeContainer.innerHTML = ['2학년', '3학년'].map(g => {
            const isActive = !isAllGrades && !isStep3Mode && (g === MultiState.activeGrade);
            const gData = yData[g] || {};
            const count = (gData.students && Array.isArray(gData.students)) ? gData.students.length : 0;
            const hasPrior = (gData.priorData && gData.priorData.students && gData.priorData.students.length > 0);
            const priorCount = hasPrior ? gData.priorData.students.length : 0;

            let modCount = 0;
            if (gData.students && Array.isArray(gData.students) && typeof isStudentChoicesModified === 'function') {
              modCount = gData.students.filter(st => isStudentChoicesModified(st, 1) || isStudentChoicesModified(st, 2)).length;
            }

            const countBadgeText = hasPrior ? `${count}명/${priorCount}명` : `${count}명`;

            return `
              <button type="button" 
                      onclick="window.selectGradeTabFromNav('${MultiState.activeYear}', '${g}')"
                      class="px-2.5 py-1 rounded-lg text-xs font-black flex items-center justify-between gap-1.5 transition cursor-pointer select-none h-[26px] ${
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs ring-2 ring-indigo-400' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold'
                      }"
                      title="${isLockedMode ? `클릭 시 ${g} 1·2단계 및 1·2학기 메뉴가 활성화됩니다` : `${MultiState.activeYear}학년도 ${g}`}">
                <span class="whitespace-nowrap">${g}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded-full font-bold whitespace-nowrap ${
                  isActive ? 'bg-white text-indigo-700 shadow-2xs' : 'bg-slate-200 text-slate-600'
                }">
                  ${countBadgeText}
                </span>
                ${hasPrior ? `
                  <span class="text-[10px] px-1 py-0.2 rounded font-bold whitespace-nowrap ${
                    isActive ? 'bg-emerald-400 text-slate-900 shadow-2xs' : 'bg-emerald-100 text-emerald-800'
                  }" title="사전 등록학생 명부 ${priorCount}명 등록 완료">
                    ✓
                  </span>
                ` : ''}
              </button>
            `;
          }).join('');
        }
      } catch (err2) {
        console.error('Error rendering academicGradeTabs:', err2);
      }

      // 3. Render Semester Tabs (1학기 / 2학기 2행) - 잠금 상태 완벽 적용!
      try {
        if (semesterNavWrapper) {
          if (isLockedMode) {
            semesterNavWrapper.classList.add('opacity-40', 'pointer-events-none', 'select-none', 'cursor-not-allowed');
            semesterNavWrapper.title = isStep3Mode 
              ? '이수과목 검증 모드에서는 학기 및 1·2단계가 비활성화(잠금)됩니다.' 
              : '전체(교원 수급 종합) 모드에서는 학기 및 단계가 비활성화됩니다.';
          } else {
            semesterNavWrapper.classList.remove('opacity-40', 'pointer-events-none', 'select-none', 'cursor-not-allowed');
            semesterNavWrapper.title = '';
          }
        }

        if (semesterContainer) {
          semesterContainer.innerHTML = [1, 2].map(sem => {
            const isActive = !isLockedMode && curSem === sem;
            
            let semModCount = 0;
            if (!isLockedMode && typeof AppState !== 'undefined' && AppState && AppState.students && Array.isArray(AppState.students) && typeof isStudentChoicesModified === 'function') {
              semModCount = AppState.students.filter(st => isStudentChoicesModified(st, sem)).length;
            }

            return `
              <button type="button" 
                      onclick="window.switchSemester(${sem})"
                      ${isLockedMode ? 'disabled' : ''}
                      class="px-3 py-1 rounded-lg text-xs font-black flex items-center justify-between gap-1.5 transition cursor-pointer select-none ${
                        isActive
                          ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-xs ring-2 ring-sky-400'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold'
                      }"
                      title="${sem}학기 선택 및 작업 전환">
                <span class="whitespace-nowrap">${sem}학기</span>
                ${semModCount > 0 ? `
                  <span class="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold whitespace-nowrap ${
                    isActive ? 'bg-amber-300 text-amber-950 shadow-2xs' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }" title="${sem}학기 수정 ${semModCount}건">
                    수정 ${semModCount}
                  </span>
                ` : ''}
              </button>
            `;
          }).join('');
        }
      } catch (err3) {
        console.error('Error rendering academicSemesterTabs:', err3);
      }

      // 4. Render Step Tabs (1단계 / 2단계 2행 - 학년별 수강신청/시간표) - 잠금 상태 완벽 적용!
      try {
        if (stepNavWrapper) {
          if (isLockedMode) {
            stepNavWrapper.classList.add('opacity-40', 'pointer-events-none', 'select-none', 'cursor-not-allowed');
            stepNavWrapper.title = isStep3Mode 
              ? '이수과목 검증 모드에서는 1·2단계가 비활성화(잠금)됩니다.' 
              : '전체(교원 수급 종합) 모드에서는 학기 및 단계가 비활성화됩니다.';
          } else {
            stepNavWrapper.classList.remove('opacity-40', 'pointer-events-none', 'select-none', 'cursor-not-allowed');
            stepNavWrapper.title = '';
          }
        }

        if (stepContainer) {
          stepContainer.innerHTML = [
            { step: 1, label: '1단계', desc: '선택 매트릭스' },
            { step: 2, label: '2단계', desc: '그룹핑 & 시간표' }
          ].map(item => {
            const isActive = !isLockedMode && curStep === item.step;
            
            let badgeHtml = '';
            if (!isLockedMode && typeof AppState !== 'undefined' && AppState) {
              if (item.step === 1) {
                const modCount = (AppState.students && Array.isArray(AppState.students) && typeof isStudentChoicesModified === 'function')
                  ? AppState.students.filter(st => isStudentChoicesModified(st, curSem)).length
                  : 0;
                if (modCount > 0) {
                  badgeHtml = `<span class="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold whitespace-nowrap ${
                    isActive ? 'bg-amber-300 text-amber-950 shadow-2xs' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }">수정 ${modCount}</span>`;
                }
              } else if (item.step === 2) {
                if (AppState.currentPlan) {
                  const conflicts = AppState.currentPlan.conflictCount || 0;
                  badgeHtml = `<span class="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold whitespace-nowrap ${
                    conflicts === 0 
                      ? (isActive ? 'bg-emerald-300 text-emerald-950 shadow-2xs' : 'bg-emerald-100 text-emerald-800')
                      : (isActive ? 'bg-rose-300 text-rose-950 shadow-2xs' : 'bg-rose-100 text-rose-800')
                  }">${conflicts === 0 ? '충돌 0명' : `충돌 ${conflicts}명`}</span>`;
                }
              }
            }

            return `
              <button type="button" 
                      onclick="window.switchStepView(${item.step})"
                      ${isLockedMode ? 'disabled' : ''}
                      class="px-2.5 py-1 rounded-lg text-xs font-black flex items-center justify-between gap-1.5 transition cursor-pointer select-none h-[26px] ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xs ring-2 ring-blue-400'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold'
                      }"
                      title="${item.label}: ${item.desc} 화면으로 전환">
                <div class="flex items-center gap-1 whitespace-nowrap">
                  <span>${item.label}</span>
                  <span class="text-[11px] font-semibold opacity-85">(${item.desc})</span>
                </div>
                ${badgeHtml}
              </button>
            `;
          }).join('');
        }
      } catch (err4) {
        console.error('Error rendering academicStepTabs:', err4);
      }

      // 5. Render Common Nav Area (공통 바깥 테두리: 위=3단계 교과군 선택조건 검증 / 아래=전체 시수종합)
      try {
        const commonTabsContainer = document.getElementById('academicCommonTabs');
        if (commonTabsContainer) {
          const isStep3Active = !isAllGrades && (MultiState.activeStep === 3);
          const isAllActive = isAllGrades;

          // 3단계 위반 요약 뱃지
          let step3BadgeHtml = '';
          const vSummary = (typeof getStep3ValidationSummaryQuick === 'function') ? getStep3ValidationSummaryQuick() : null;
          if (vSummary && vSummary.total > 0) {
            if (vSummary.violated > 0) {
              step3BadgeHtml = `<span class="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold whitespace-nowrap ${
                isStep3Active ? 'bg-rose-300 text-rose-950 shadow-2xs' : 'bg-rose-100 text-rose-800'
              }">위반 ${vSummary.violated}명</span>`;
            } else {
              step3BadgeHtml = `<span class="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold whitespace-nowrap ${
                isStep3Active ? 'bg-emerald-300 text-emerald-950 shadow-2xs' : 'bg-emerald-100 text-emerald-800'
              }">정상</span>`;
            }
          }

          // 전체 시수종합 요약 뱃지
          const acadData = (typeof getAcadData === 'function') ? getAcadData() : {};
          const yData = acadData[MultiState.activeYear] || {};
          const allData = yData['전체'] || {};
          const curCount = (allData.curriculum && Array.isArray(allData.curriculum)) ? allData.curriculum.length : 0;
          const teacherSet = new Set((allData.curriculum || []).map(c => c.teacher).filter(t => t && t !== '폐강'));

          commonTabsContainer.innerHTML = `
            <!-- 위: 3단계 교과군 선택조건 검증 -->
            <button type="button" 
                    onclick="window.toggleStep3OrStep1()"
                    class="px-2.5 py-1 rounded-lg text-xs font-black flex items-center justify-between gap-1.5 transition cursor-pointer select-none h-[26px] ${
                      isStep3Active 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-xs ring-2 ring-purple-400' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200'
                    }"
                    title="3단계: 이수과목 검증 화면으로 전환">
              <div class="flex items-center gap-1.5 whitespace-nowrap">
                <span>📋</span>
                <span>이수과목 검증</span>
              </div>
              ${step3BadgeHtml}
            </button>

            <!-- 아래: 전체 시수종합 -->
            <button type="button" 
                    onclick="window.switchAcademicContext('${MultiState.activeYear}', '전체')"
                    class="px-2.5 py-1 rounded-lg text-xs font-black flex items-center justify-between gap-1.5 transition cursor-pointer select-none h-[26px] ${
                      isAllActive 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs ring-2 ring-emerald-400' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200'
                    }"
                    title="${MultiState.activeYear} 전학년(1·2·3학년) 교사별 시수 및 교육과정 종합 관리">
              <div class="flex items-center gap-1.5 whitespace-nowrap">
                <span>📊</span>
                <span>전체 시수종합</span>
              </div>
              <div class="flex items-center gap-1 text-[10px] whitespace-nowrap">
                <span class="px-1.5 py-0.2 rounded-full font-bold ${
                  isAllActive ? 'bg-white text-emerald-800 shadow-2xs' : 'bg-slate-100 text-slate-600'
                }">
                  ${curCount > 0 ? `교사 ${teacherSet.size}명` : '교원수급'}
                </span>
                ${curCount > 0 ? `
                  <span class="px-1.5 py-0.2 rounded-full font-bold ${
                    isAllActive ? 'bg-amber-300 text-slate-900 shadow-2xs' : 'bg-amber-100 text-amber-900'
                  }" title="${curCount}개 과목 편성됨">
                    ${curCount}과목
                  </span>
                ` : ''}
              </div>
            </button>
          `;
        }
      } catch (err5) {
        console.error('Error rendering academicCommonTabs:', err5);
      }

      // 기준 날짜 탭 드래그 앤 드롭 순서 변경 바인딩
      try {
        attachYearTabsDragAndDrop();
      } catch (errDrag) {
        console.warn('attachYearTabsDragAndDrop failed silently:', errDrag);
      }
  } catch (globalNavErr) {
    console.error('FATAL in renderYearGradeNav:', globalNavErr);
  }
}
window.renderYearGradeNav = renderYearGradeNav;

    let draggedYearTab = null;

    function attachYearTabsDragAndDrop() {
      const yearContainer = document.getElementById('academicYearTabs');
      if (!yearContainer) return;

      const tabs = yearContainer.querySelectorAll('[data-year]');
      tabs.forEach(tab => {
        const y = tab.getAttribute('data-year');

        tab.addEventListener('dragstart', (e) => {
          draggedYearTab = y;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', y);
          tab.classList.add('opacity-40', 'scale-95');
        });

        tab.addEventListener('dragend', () => {
          draggedYearTab = null;
          tabs.forEach(t => {
            t.classList.remove('opacity-40', 'scale-95');
            t.style.borderLeft = '';
            t.style.borderRight = '';
            t.style.borderTop = '';
            t.style.borderBottom = '';
          });
        });

        tab.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (!draggedYearTab || draggedYearTab === y) return;

          const rect = tab.getBoundingClientRect();
          const isAfter = (e.clientY > rect.top + rect.height / 2);
          if (isAfter) {
            tab.style.borderBottom = '3px solid #3B82F6';
            tab.style.borderTop = '';
          } else {
            tab.style.borderTop = '3px solid #3B82F6';
            tab.style.borderBottom = '';
          }
        });

        tab.addEventListener('dragleave', () => {
          tab.style.borderTop = '';
          tab.style.borderBottom = '';
          tab.style.borderLeft = '';
          tab.style.borderRight = '';
        });

        tab.addEventListener('drop', (e) => {
          e.preventDefault();
          tab.style.borderTop = '';
          tab.style.borderBottom = '';
          tab.style.borderLeft = '';
          tab.style.borderRight = '';
          if (!draggedYearTab || draggedYearTab === y) return;

          const rect = tab.getBoundingClientRect();
          const isAfter = (e.clientY > rect.top + rect.height / 2);

          const fromIdx = MultiState.yearsList.indexOf(draggedYearTab);
          if (fromIdx === -1) return;

          // Remove dragged item
          const [movedItem] = MultiState.yearsList.splice(fromIdx, 1);
          // Calculate new index after removal
          const toIdx = MultiState.yearsList.indexOf(y);
          const insertIdx = isAfter ? toIdx + 1 : toIdx;

          MultiState.yearsList.splice(insertIdx, 0, movedItem);

          const acadYear = MultiState.activeAcademicYear || '2027학년도';
          if (!MultiState.datesByAcademicYear) MultiState.datesByAcademicYear = {};
          MultiState.datesByAcademicYear[acadYear] = [...MultiState.yearsList];

          saveAllState();
          renderYearGradeNav();
        });
      });
    }

    window.switchAcademicContext = switchAcademicContext;

    window.handleEditAcademicYear = function(oldYear, event) {
      if (event) event.stopPropagation();
      const input = prompt(`[${oldYear}]의 새 이름을 입력하세요:\n(숫자, 한글 등 제약 없이 입력 가능)`, oldYear);
      if (!input) return;
      const newYear = input.trim();
      if (!newYear) {
        alert('이름을 입력해주세요.');
        return;
      }
      if (newYear === oldYear) return;
      if (MultiState.yearsList.includes(newYear)) {
        alert(`이미 존재하는 이름입니다: ${newYear}`);
        return;
      }

      // 순서 유지하며 변경
      MultiState.yearsList = MultiState.yearsList.map(y => y === oldYear ? newYear : y);

      // datesByAcademicYear도 함께 갱신
      const acadYear = MultiState.activeAcademicYear || '2027학년도';
      if (!MultiState.datesByAcademicYear) MultiState.datesByAcademicYear = {};
      MultiState.datesByAcademicYear[acadYear] = [...MultiState.yearsList];

      // 데이터 키 변경 (격리 구조)
      const acadData = getAcadData();
      acadData[newYear] = acadData[oldYear] || {
        '2학년': createEmptyGradeState('2학년'),
        '3학년': createEmptyGradeState('3학년'),
        '전체': { curriculum: [], lastUpdated: null }
      };
      delete acadData[oldYear];

      if (MultiState.activeYear === oldYear) {
        MultiState.activeYear = newYear;
      }

      saveAllState();
      renderYearGradeNav();
      alert(`✅ [${oldYear}]이(가) [${newYear}](으)로 성공적으로 변경되었습니다.`);
    };

    window.handleDeleteAcademicYear = function(year, event) {
      if (event) event.stopPropagation();
      if (!MultiState.yearsList || MultiState.yearsList.length <= 1) {
        alert('최소 1개의 기준 날짜 탭은 유지되어야 하므로 삭제할 수 없습니다.');
        return;
      }
      if (!confirm(`[${year}]의 모든 학생 명부, 수강신청 결과 및 그룹핑 배치가 완전히 삭제됩니다.\n정말 삭제하시겠습니까?`)) return;

      MultiState.yearsList = MultiState.yearsList.filter(y => y !== year);
      const acadData = getAcadData();
      delete acadData[year];

      const acadYear = MultiState.activeAcademicYear || '2027학년도';
      if (MultiState.datesByAcademicYear && MultiState.datesByAcademicYear[acadYear]) {
        MultiState.datesByAcademicYear[acadYear] = MultiState.datesByAcademicYear[acadYear].filter(y => y !== year);
      }

      if (MultiState.activeYear === year) {
        MultiState.activeYear = MultiState.yearsList[0] || '2027';
      }

      switchAcademicContext(MultiState.activeYear, MultiState.activeGrade, false);
      saveAllState();
      renderYearGradeNav();
      alert(`🗑️ [${year}] 기준 날짜 탭이 삭제되었습니다.`);
    };

    function updateModalStats() {
      const detail = document.getElementById('modalStorageDetail');
      if (!detail) return;
      const counts = [];
      const acadData = getAcadData();
      MultiState.yearsList.forEach(y => {
        const yData = acadData[y] || {};
        const c2 = (yData['2학년'] && yData['2학년'].students) ? yData['2학년'].students.length : 0;
        const c3 = (yData['3학년'] && yData['3학년'].students) ? yData['3학년'].students.length : 0;
        counts.push(`${y}: 2학년(${c2}명) · 3학년(${c3}명)`);
      });
      detail.textContent = counts.join(' | ');
    }

    function applyExternalMultiState(externalData, showSuccessMsg = true) {
      if (!externalData || typeof externalData !== 'object') {
        alert('올바른 백업 데이터 형식이 아닙니다.');
        return;
      }

      // Case A: 단일 AppState 형태 (students 또는 sem1Subjects가 최상위에 직접 있는 경우)
      if ((externalData.students || externalData.sem1Subjects) && !externalData.data) {
        const detectedG = externalData.detectedGrade || (externalData.students?.[0]?.studentId?.startsWith('3') ? '3학년' : '2학년');
        const ay = MultiState.activeAcademicYear || '2027학년도';
        const d = MultiState.activeYear || '2027.10.11.';
        
        if (!MultiState.data[ay]) MultiState.data[ay] = {};
        if (!MultiState.data[ay][d]) MultiState.data[ay][d] = {};
        MultiState.data[ay][d][detectedG] = JSON.parse(JSON.stringify(externalData));
        MultiState.activeGrade = detectedG;

        switchAcademicContext(d, detectedG, false);
        saveAllState();
        renderYearGradeNav();
        updateModalStats();
        if (showSuccessMsg) {
          alert(`🎉 [${detectedG}] 단일 작업 데이터가 성공적으로 복원되었습니다!\n(학생: ${(externalData.students || []).length}명)`);
        }
        return;
      }

      // Case B: MultiState 구조 복원
      const rawData = externalData.data || {};
      const targetAY = externalData.activeAcademicYear || MultiState.activeAcademicYear || '2027학년도';
      MultiState.data = migrateDataStructure(rawData, targetAY);

      // 1. academicYearsList 복원 (MultiState.data에 있는 모든 학년도 키 포함 보장)
      const dataAYKeys = Object.keys(MultiState.data).filter(k => k && k.includes('학년도'));
      let restoredAYList = Array.isArray(externalData.academicYearsList) && externalData.academicYearsList.length > 0
        ? [...externalData.academicYearsList]
        : (dataAYKeys.length > 0 ? dataAYKeys : [targetAY]);
      dataAYKeys.forEach(k => {
        if (!restoredAYList.includes(k)) restoredAYList.push(k);
      });
      if (!restoredAYList.includes(targetAY)) restoredAYList.unshift(targetAY);
      MultiState.academicYearsList = restoredAYList;

      // 2. activeAcademicYear 설정
      if (externalData.activeAcademicYear && restoredAYList.includes(externalData.activeAcademicYear)) {
        MultiState.activeAcademicYear = externalData.activeAcademicYear;
      } else if (restoredAYList.includes(targetAY)) {
        MultiState.activeAcademicYear = targetAY;
      } else {
        MultiState.activeAcademicYear = restoredAYList[0] || '2027학년도';
      }
      const curAY = MultiState.activeAcademicYear;

      // 3. datesByAcademicYear 복원
      if (!MultiState.datesByAcademicYear) MultiState.datesByAcademicYear = {};
      if (externalData.datesByAcademicYear && typeof externalData.datesByAcademicYear === 'object') {
        MultiState.datesByAcademicYear = JSON.parse(JSON.stringify(externalData.datesByAcademicYear));
      }
      // 각 학년도별로 datesByAcademicYear가 비어있다면 MultiState.data[ay]에서 날짜 키 자동 추출
      MultiState.academicYearsList.forEach(ay => {
        if (!MultiState.datesByAcademicYear[ay] || !Array.isArray(MultiState.datesByAcademicYear[ay]) || MultiState.datesByAcademicYear[ay].length === 0) {
          const ayData = MultiState.data[ay] || {};
          const dKeys = Object.keys(ayData).filter(k => k && k !== '전체');
          if (dKeys.length > 0) {
            MultiState.datesByAcademicYear[ay] = dKeys;
          } else if (Array.isArray(externalData.yearsList) && externalData.yearsList.length > 0 && ay === curAY) {
            MultiState.datesByAcademicYear[ay] = [...externalData.yearsList];
          } else {
            const defaultDate = ay.replace(/[^0-9]/g, '') + '.10.11.';
            MultiState.datesByAcademicYear[ay] = [defaultDate];
          }
        }
      });

      // 4. yearsList 및 activeYear 설정
      MultiState.yearsList = [...(MultiState.datesByAcademicYear[curAY] || ['2027.10.11.'])];
      if (externalData.activeYear && MultiState.yearsList.includes(externalData.activeYear)) {
        MultiState.activeYear = externalData.activeYear;
      } else {
        MultiState.activeYear = MultiState.yearsList[0] || '2027.10.11.';
      }

      // 5. activeGrade 설정 (기본은 '2학년', 만약 3학년 데이터만 있고 2학년 데이터가 없다면 3학년으로 설정)
      const curDateData = (MultiState.data[curAY] && MultiState.data[curAY][MultiState.activeYear]) || {};
      const hasG2 = curDateData['2학년']?.students?.length > 0 || curDateData['2학년']?.priorData?.students?.length > 0;
      const hasG3 = curDateData['3학년']?.students?.length > 0 || curDateData['3학년']?.priorData?.students?.length > 0;
      
      if (externalData.activeGrade && ['2학년', '3학년', '전체'].includes(externalData.activeGrade)) {
        MultiState.activeGrade = externalData.activeGrade;
      } else if (!hasG2 && hasG3) {
        MultiState.activeGrade = '3학년';
      } else {
        MultiState.activeGrade = '2학년';
      }

      // 6. 교사 순서, 교육과정, 출판사, 교과군 복원
      if (Array.isArray(externalData.customTeacherOrder)) {
        MultiState.customTeacherOrder = [...externalData.customTeacherOrder];
      }
      if (externalData.curriculumByAcademicYear && typeof externalData.curriculumByAcademicYear === 'object') {
        MultiState.curriculumByAcademicYear = {};
        for (const ay in externalData.curriculumByAcademicYear) {
          const arr = externalData.curriculumByAcademicYear[ay];
          if (Array.isArray(arr)) {
            MultiState.curriculumByAcademicYear[ay] = arr.map((c, idx) => sanitizeCurriculumItem(c, idx)).filter(Boolean);
          } else {
            MultiState.curriculumByAcademicYear[ay] = [];
          }
        }
      } else if (Array.isArray(externalData.curriculum)) {
        if (!MultiState.curriculumByAcademicYear) MultiState.curriculumByAcademicYear = {};
        MultiState.curriculumByAcademicYear[curAY] = externalData.curriculum.map((c, idx) => sanitizeCurriculumItem(c, idx)).filter(Boolean);
      }

      if (externalData.publishersByAcademicYear && typeof externalData.publishersByAcademicYear === 'object') {
        MultiState.publishersByAcademicYear = JSON.parse(JSON.stringify(externalData.publishersByAcademicYear));
      }
      if (externalData.publisherSubjectNamesByAcademicYear && typeof externalData.publisherSubjectNamesByAcademicYear === 'object') {
        MultiState.publisherSubjectNamesByAcademicYear = JSON.parse(JSON.stringify(externalData.publisherSubjectNamesByAcademicYear));
      }
      if (externalData.subjectGroupsByAcademicYear && typeof externalData.subjectGroupsByAcademicYear === 'object') {
        MultiState.subjectGroupsByAcademicYear = JSON.parse(JSON.stringify(externalData.subjectGroupsByAcademicYear));
      }
      if (externalData.gradeClassCounts && typeof externalData.gradeClassCounts === 'object') {
        MultiState.gradeClassCounts = {
          '1학년': Math.max(1, parseInt(externalData.gradeClassCounts['1학년'] || 2, 10)),
          '2학년': Math.max(1, parseInt(externalData.gradeClassCounts['2학년'] || 2, 10)),
          '3학년': Math.max(1, parseInt(externalData.gradeClassCounts['3학년'] || 2, 10))
        };
      }

      if (typeof updatePublisherButtonUI === 'function') updatePublisherButtonUI();
      if (typeof updateGradeClassCountBadge === 'function') updateGradeClassCountBadge();

      // 7. 화면 및 UI 갱신 (3단계 검증 캐시 초기화 및 재검증 포함)
      window._step3LastValidationResult = null;
      switchAcademicContext(MultiState.activeYear, MultiState.activeGrade, false);
      if (typeof runStep3Validation === 'function') {
        runStep3Validation(false);
      }
      saveAllState();
      renderYearGradeNav();
      updateModalStats();

      if (showSuccessMsg) {
        let totalCount = 0;
        const curAcad = getAcadData();
        const dateData = curAcad[MultiState.activeYear] || {};
        ['2학년', '3학년'].forEach(g => {
          if (dateData[g]?.students) totalCount += dateData[g].students.length;
        });
        alert(`🎉 백업 데이터가 성공적으로 반영되었습니다!\n\n` +
              `• 기준 학년도: ${MultiState.activeAcademicYear}\n` +
              `• 기준 날짜: ${MultiState.activeYear} (${MultiState.yearsList.length}개 날짜 탭)\n` +
              `• 현재 활성: ${MultiState.activeGrade}\n` +
              `• 등록 학생: 총 ${totalCount}명`);
      }
    }

    // Modal Event Bindings
    function openCloudModal() {
      updateModalStats();
      const cfgInput = document.getElementById('inputFirebaseConfig');
      if (cfgInput) {
        cfgInput.value = localStorage.getItem(FIREBASE_CONFIG_KEY) || '';
      }
      document.getElementById('cloudSettingsModal')?.classList.remove('hidden');
    }

    function closeCloudModal() {
      document.getElementById('cloudSettingsModal')?.classList.add('hidden');
    }

    document.getElementById('btnCloudStatus')?.addEventListener('click', openCloudModal);
    document.getElementById('btnCloseCloudModal')?.addEventListener('click', closeCloudModal);
    document.getElementById('btnDismissCloudModal')?.addEventListener('click', closeCloudModal);

    // Save Firebase Config
    document.getElementById('btnSaveFirebaseConfig')?.addEventListener('click', () => {
      const val = document.getElementById('inputFirebaseConfig')?.value.trim();
      if (!val) {
        alert('Firebase 설정을 입력해주세요.');
        return;
      }
      try {
        const clean = val.replace(/^[^{]*{/, '{').replace(/}[^}]*$/, '}');
        const cfg = JSON.parse(clean);
        if (!cfg.apiKey || !cfg.projectId) {
          throw new Error('apiKey와 projectId가 필요합니다.');
        }
        localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(cfg));
        cloudSync.init();
        alert('🎉 Firebase 클라우드 DB 연결 설정이 저장되었습니다!');
        saveAllState();
      } catch (err) {
        alert('Firebase 설정 파싱 오류: ' + err.message);
      }
    });

    document.getElementById('btnClearFirebaseConfig')?.addEventListener('click', () => {
      localStorage.removeItem(FIREBASE_CONFIG_KEY);
      cloudSync.firestoreDb = null;
      cloudSync.firebaseApp = null;
      cloudSync.status = 'local';
      cloudSync.updateUiBadge('local');
      alert('Firebase 클라우드 연동이 해제되었습니다. 로컬 자동 저장 모드로 전환됩니다.');
    });

    // Add Academic Year / Reference Date button
    document.getElementById('btnAddYear')?.addEventListener('click', () => {
      const numericYears = MultiState.yearsList.map(Number).filter(n => !isNaN(n) && n > 2000);
      const defaultSuggest = numericYears.length > 0 ? String(Math.max(...numericYears) + 1) : '';
      const input = prompt('추가할 기준 날짜(또는 학년도/명칭)를 입력하세요:\n(예: 2026.10.19, 2027 등 숫자, 한글 제약 없음)', defaultSuggest);
      if (!input) return;
      const y = input.trim();
      if (!y) {
        alert('입력 내용이 비어 있습니다.');
        return;
      }
      if (MultiState.yearsList.includes(y)) {
        alert(`이미 존재하는 항목입니다: ${y}`);
        return;
      }

      const acadData = getAcadData();
      const prevYear = MultiState.activeYear;
      const prevCurriculum = (prevYear && acadData[prevYear]?.['전체']?.curriculum) || [];

      MultiState.yearsList.push(y);
      const currAY = MultiState.activeAcademicYear || '2027학년도';
      if (!MultiState.datesByAcademicYear) MultiState.datesByAcademicYear = {};
      MultiState.datesByAcademicYear[currAY] = MultiState.yearsList;

      if (!acadData[y]) {
        acadData[y] = {
          '2학년': createEmptyGradeState('2학년'),
          '3학년': createEmptyGradeState('3학년'),
          '전체': { curriculum: [], lastUpdated: null }
        };

        // 이전 기준 날짜의 학생 수강신청 데이터(2학년, 3학년) 복사 여부 질문
        if (prevYear && acadData[prevYear]) {
          const prevG2 = acadData[prevYear]['2학년'];
          const prevG3 = acadData[prevYear]['3학년'];
          const c2 = (prevG2 && prevG2.students) ? prevG2.students.length : 0;
          const c3 = (prevG3 && prevG3.students) ? prevG3.students.length : 0;

          if (c2 > 0 || c3 > 0) {
            if (confirm(`💡 새 기준 날짜 [${y}] 생성 안내:\n\n이전 기준 날짜 [${prevYear}]의 수강신청 데이터(2학년 ${c2}명, 3학년 ${c3}명)를 새 탭으로 복사해 오시겠습니까?\n\n- [확인]: 이전 데이터(학생 명부 및 선택 과목)를 유지한 상태로 새 탭 시작\n- [취소]: 빈 상태로 시작 (새로운 엑셀 설문 파일 업로드 필요)`)) {
              if (c2 > 0 && prevG2) {
                acadData[y]['2학년'] = JSON.parse(JSON.stringify(prevG2));
                acadData[y]['2학년']._closedImportedFromPrev = true;
              }
              if (c3 > 0 && prevG3) {
                acadData[y]['3학년'] = JSON.parse(JSON.stringify(prevG3));
                acadData[y]['3학년']._closedImportedFromPrev = true;
              }
            }
          }
        }
      }

      switchAcademicContext(y, MultiState.activeGrade);

      if (prevCurriculum && prevCurriculum.length > 0) {
        if (confirm(`💡 새 기준 날짜 [${y}] 생성 안내:\n\n이전 기준 날짜 [${prevYear}]의 '전체 시수종합' 최신 데이터(${prevCurriculum.length}개 과목)를 새 탭으로 복사해 오시겠습니까?\n\n- [확인]: 이전 탭의 최신 수정본을 즉시 복사하여 작업 시작\n- [취소]: 빈 상태로 시작 (다운로드한 엑셀 파일을 나중에 업로드 가능)`)) {
          const clonedCurriculum = JSON.parse(JSON.stringify(prevCurriculum));
          setAllGradesCurriculum(clonedCurriculum);
          renderAllGradesDashboard();
        }
      }

      saveAllState();
    });

    // ==========================================
    // BACKUP & RESTORE DATA (.json)
    // ==========================================

    window.generateFullBackupJsonString = function() {
      syncCurrentToMulti();
      return JSON.stringify(MultiState, null, 2);
    };

    window.generateDefaultBackupFileName = function() {
      return buildExportFileName("수강신청 및 그룹핑 데이터", "json");
    };

    window.exportStandardDownload = function() {
      if (typeof window.closeSaveDropdown === 'function') window.closeSaveDropdown();
      const jsonStr = window.generateFullBackupJsonString();
      const filename = window.generateDefaultBackupFileName();
      const jsonBlob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(jsonBlob);
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute("href", url);
      dlAnchor.setAttribute("download", filename);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        dlAnchor.remove();
      }, 500);
    };

    let rememberedDirHandle = null;

    // ==========================================
    // GLOBAL EXCEL FILE EXPORTER (상단 '경로' 폴더에 자동 저장, 미지정 시 기본 다운로드)
    // ==========================================
    // ==========================================
    // UNIFIED FILE SAVER (상단 '경로' 폴더에 자동 저장, 미지정 시 파일 선택창 또는 브라우저 다운로드)
    // ==========================================
    window.saveFileToDirectoryOrDownload = async function(content, filename, mimeType = 'application/octet-stream', description = '파일') {
      let dirHandle = rememberedDirHandle;
      if (!dirHandle && typeof getSavedDirHandle === 'function') {
        dirHandle = await getSavedDirHandle();
      }

      // 1. 상단 [📁 경로 지정]에서 지정된 폴더가 있는 경우
      if (dirHandle && window.showDirectoryPicker) {
        try {
          if (typeof dirHandle.queryPermission === 'function') {
            let perm = await dirHandle.queryPermission({ mode: 'readwrite' });
            if (perm !== 'granted') {
              perm = await dirHandle.requestPermission({ mode: 'readwrite' });
              if (perm !== 'granted') throw new Error('Permission denied');
            }
          }

          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          if (content instanceof Blob) {
            await writable.write(content);
          } else if (content instanceof ArrayBuffer || ArrayBuffer.isView(content)) {
            await writable.write(content);
          } else {
            await writable.write(String(content));
          }
          await writable.close();

          if (typeof updateSaveDirectoryUI === 'function') updateSaveDirectoryUI(dirHandle.name);
          if (typeof showSaveToast === 'function') {
            showSaveToast(`📁 <b>[${dirHandle.name}]</b> 폴더에 저장되었습니다!<br><span class="text-[11px] opacity-80 font-normal">📄 ${filename}</span>`, true);
          }
          return { success: true, method: 'directory', dirName: dirHandle.name };
        } catch (err) {
          console.warn('saveFileToDirectoryOrDownload dirHandle write failed, attempting save picker or fallback:', err);
        }
      }

      // 2. 지정된 폴더가 없거나 쓰기 실패 시, 브라우저가 showSaveFilePicker를 지원하면 사용자가 저장 경로를 직접 선택할 수 있도록 대화상자 표시
      if (window.showSaveFilePicker) {
        try {
          const ext = filename.split('.').pop()?.toLowerCase() || '';
          let types = [];
          if (ext === 'html') {
            types = [{ description: 'HTML 웹페이지 (*.html)', accept: { 'text/html': ['.html'] } }];
          } else if (ext === 'xlsx') {
            types = [{ description: '엑셀 파일 (*.xlsx)', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }];
          } else if (ext === 'json') {
            types = [{ description: 'JSON 백업 파일 (*.json)', accept: { 'application/json': ['.json'] } }];
          }

          const pickerOptions = { suggestedName: filename };
          if (types.length > 0) pickerOptions.types = types;

          const fileHandle = await window.showSaveFilePicker(pickerOptions);
          const writable = await fileHandle.createWritable();
          if (content instanceof Blob) {
            await writable.write(content);
          } else if (content instanceof ArrayBuffer || ArrayBuffer.isView(content)) {
            await writable.write(content);
          } else {
            await writable.write(String(content));
          }
          await writable.close();

          if (typeof showSaveToast === 'function') {
            showSaveToast(`💾 지정하신 경로에 파일이 성공적으로 저장되었습니다!<br><span class="text-[11px] opacity-80 font-normal">📄 ${filename}</span>`, true);
          }
          return { success: true, method: 'picker' };
        } catch (err) {
          if (err.name === 'AbortError') {
            return { success: false, cancelled: true };
          }
          console.warn('showSaveFilePicker fallback:', err);
        }
      }

      // 3. 마지막 폴백: 브라우저 기본 다운로드
      const blob = (content instanceof Blob) ? content : new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 1000);

      if (typeof showSaveToast === 'function') {
        showSaveToast(`📥 브라우저 다운로드 폴더에 저장되었습니다.<br><span class="text-[11px] opacity-80 font-normal">📄 ${filename}</span>`, true);
      }
      return { success: true, method: 'download' };
    };

    // ==========================================
    // GLOBAL EXCEL FILE EXPORTER (상단 '경로' 폴더에 자동 저장, 미지정 시 파일 선택창)
    // ==========================================
    window.saveExcelFile = async function(wb, filename) {
      let excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      // 틀고정(freeze panes) 적용 (JSZip 후처리)
      if (typeof JSZip !== 'undefined') {
        try {
          let hasFreeze = false;
          (wb.SheetNames || []).forEach(name => {
            const sheet = wb.Sheets[name];
            if (sheet && (sheet['!freeze'] || sheet['!views'])) hasFreeze = true;
          });

          if (hasFreeze) {
            const zip = await JSZip.loadAsync(excelBuffer);
            for (let idx = 0; idx < (wb.SheetNames || []).length; idx++) {
              const sName = wb.SheetNames[idx];
              const sheet = wb.Sheets[sName];
              if (!sheet || (!sheet['!freeze'] && !sheet['!views'])) continue;
              const ySplit = sheet['!freeze']?.ySplit || sheet['!views']?.[0]?.ySplit || 4;
              const topLeftCell = sheet['!freeze']?.topLeftCell || sheet['!views']?.[0]?.topLeftCell || `A${ySplit + 1}`;
              const targetXmlName = `xl/worksheets/sheet${idx + 1}.xml`;
              const zipFile = zip.file(targetXmlName);
              if (zipFile) {
                const sheetXml = await zipFile.async('text');
                const paneXml = `<sheetView workbookViewId="0"><pane ySplit="${ySplit}" topLeftCell="${topLeftCell}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="${topLeftCell}" sqref="${topLeftCell}"/></sheetView>`;
                let newXml = sheetXml;
                if (newXml.includes('<sheetView workbookViewId="0"/>')) {
                  newXml = newXml.replace('<sheetView workbookViewId="0"/>', paneXml);
                } else if (newXml.includes('<sheetView workbookViewId="0">') && !newXml.includes('state="frozen"')) {
                  newXml = newXml.replace('<sheetView workbookViewId="0">', `<sheetView workbookViewId="0"><pane ySplit="${ySplit}" topLeftCell="${topLeftCell}" activePane="bottomLeft" state="frozen"/>`);
                }
                zip.file(targetXmlName, newXml);
              }
            }
            excelBuffer = await zip.generateAsync({ type: 'arraybuffer' });
          }
        } catch (zErr) {
          console.warn('JSZip freeze pane injection skipped:', zErr);
        }
      }

      return await window.saveFileToDirectoryOrDownload(
        excelBuffer,
        filename,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '엑셀 파일'
      );
    };

    async function getSavedDirHandle() {
      if (rememberedDirHandle) return rememberedDirHandle;
      return new Promise((resolve) => {
        try {
          if (!window.indexedDB) return resolve(null);
          const req = indexedDB.open('SangjiCourseRegHandleDB', 2);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('handles')) {
              db.createObjectStore('handles');
            }
          };
          req.onsuccess = (e) => {
            const db = e.target.result;
            try {
              const tx = db.transaction('handles', 'readonly');
              const store = tx.objectStore('handles');
              const getReq = store.get('savedDirHandle');
              getReq.onsuccess = () => {
                rememberedDirHandle = getReq.result || null;
                resolve(rememberedDirHandle);
              };
              getReq.onerror = () => resolve(null);
            } catch { resolve(null); }
          };
          req.onerror = () => resolve(null);
        } catch { resolve(null); }
      });
    }

    async function setSavedDirHandle(handle) {
      rememberedDirHandle = handle;
      return new Promise((resolve) => {
        try {
          if (!window.indexedDB || !handle) return resolve(false);
          const req = indexedDB.open('SangjiCourseRegHandleDB', 2);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('handles')) {
              db.createObjectStore('handles');
            }
          };
          req.onsuccess = (e) => {
            const db = e.target.result;
            try {
              const tx = db.transaction('handles', 'readwrite');
              const store = tx.objectStore('handles');
              store.put(handle, 'savedDirHandle');
              tx.oncomplete = () => resolve(true);
              tx.onerror = () => resolve(false);
            } catch { resolve(false); }
          };
          req.onerror = () => resolve(false);
        } catch { resolve(false); }
      });
    }

    async function clearSavedDirHandle() {
      rememberedDirHandle = null;
      return new Promise((resolve) => {
        try {
          if (!window.indexedDB) return resolve(false);
          const req = indexedDB.open('SangjiCourseRegHandleDB', 2);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('handles')) {
              db.createObjectStore('handles');
            }
          };
          req.onsuccess = (e) => {
            const db = e.target.result;
            try {
              const tx = db.transaction('handles', 'readwrite');
              const store = tx.objectStore('handles');
              store.delete('savedDirHandle');
              store.delete('lastSaveHandle');
              tx.oncomplete = () => resolve(true);
              tx.onerror = () => resolve(false);
            } catch { resolve(false); }
          };
          req.onerror = () => resolve(false);
        } catch { resolve(false); }
      });
    }

    // 알림 토스트 (모달 방해 없이 즉각적인 시각 피드백 제공)
    function showSaveToast(message, isSuccess = true) {
      let toast = document.getElementById('sangjiSaveToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sangjiSaveToast';
        toast.className = 'fixed top-5 right-5 z-[9999] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold transition-all duration-300 transform -translate-y-4 opacity-0 pointer-events-none';
        document.body.appendChild(toast);
      }
      toast.className = `fixed top-5 right-5 z-[9999] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold transition-all duration-300 transform translate-y-0 opacity-100 ${
        isSuccess ? 'bg-slate-900 text-white border border-slate-700' : 'bg-rose-600 text-white'
      }`;
      toast.innerHTML = message;

      if (window._sangjiSaveToastTimer) clearTimeout(window._sangjiSaveToastTimer);
      window._sangjiSaveToastTimer = setTimeout(() => {
        toast.className = toast.className.replace('translate-y-0 opacity-100', '-translate-y-4 opacity-0 pointer-events-none');
      }, 2800);
    }

    function updateSaveDirectoryUI(dirName) {
      const dirText = document.getElementById('saveDirButtonText');
      const dirBtn = document.getElementById('btnSetSaveDirectory');
      const saveBtn = document.getElementById('btnHeaderExportSession');
      if (dirName) {
        const shortName = dirName.length > 10 ? dirName.slice(0, 9) + '…' : dirName;
        if (dirText) dirText.textContent = `경로: ${shortName}`;
        if (dirBtn) {
          dirBtn.title = `현재 지정된 폴더: [${dirName}]\n클릭하면 저장 경로를 다른 폴더로 변경할 수 있습니다.`;
          dirBtn.classList.add('border-blue-400', 'bg-blue-50/60', 'text-blue-800');
          dirBtn.classList.remove('text-slate-700', 'bg-slate-50', 'border-slate-300');
        }
        if (saveBtn) {
          saveBtn.title = `클릭 시 [${dirName}] 폴더에 시간별 새 파일로 즉시 저장합니다.`;
        }
      } else {
        if (dirText) dirText.textContent = '경로 지정';
        if (dirBtn) {
          dirBtn.title = '작업 파일이 저장될 폴더 경로를 지정합니다 (최초 1회 설정 시 계속 유지)';
          dirBtn.classList.remove('border-blue-400', 'bg-blue-50/60', 'text-blue-800');
          dirBtn.classList.add('text-slate-700', 'bg-slate-50', 'border-slate-300');
        }
        if (saveBtn) {
          saveBtn.title = '클릭 시 지정된 경로에 작업 데이터를 바로 저장합니다. (미지정 시 폴더 선택)';
        }
      }
    }
    window.updateSaveButtonTooltip = updateSaveDirectoryUI;

    // 경로 지정 메뉴 (최초 1회 지정 시 IndexedDB에 영구 저장)
    window.selectSaveDirectory = async function() {
      if (!window.showDirectoryPicker) {
        alert('현재 사용 중인 브라우저에서는 폴더 직접 지정 기능이 지원되지 않습니다.\n(Chrome 또는 Edge 최신 버전을 권장합니다)\n\n작업 저장 시 브라우저 기본 다운로드 폴더에 자동 저장됩니다.');
        return;
      }

      try {
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        if (dirHandle) {
          await setSavedDirHandle(dirHandle);
          updateSaveDirectoryUI(dirHandle.name);
          alert(`✅ 저장 경로가 [${dirHandle.name}] 폴더로 지정되었습니다!\n\n앞으로 [작업 저장] 버튼을 누르면 이 폴더에 바로바로 새 파일로 안전하게 저장됩니다.`);
        }
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled
        console.warn('showDirectoryPicker error:', err);
        alert('폴더 접근 권한을 얻지 못했거나 취소되었습니다.');
      }
    };
    window.saveWithNewLocation = window.selectSaveDirectory;

    // 작업 저장 버튼 (누르면 바로바로 저장)
    window.handleMainSaveButtonClick = async function() {
      const jsonStr = window.generateFullBackupJsonString();
      const filename = window.generateDefaultBackupFileName();

      let dirHandle = rememberedDirHandle;
      if (!dirHandle) dirHandle = await getSavedDirHandle();

      // 저장 경로가 아직 지정되지 않은 경우 최초 1회 폴더 선택 대화상자 표시
      if (!dirHandle && window.showDirectoryPicker) {
        try {
          alert('📁 작업 데이터를 저장할 폴더를 먼저 지정해주세요.\n(한 번 지정하면 이후부터는 버튼 클릭 시 바로바로 자동 저장됩니다)');
          dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
          if (dirHandle) {
            await setSavedDirHandle(dirHandle);
            updateSaveDirectoryUI(dirHandle.name);
          }
        } catch (err) {
          if (err.name === 'AbortError') return; // 취소한 경우 저장 진행 안함
          console.warn('showDirectoryPicker error during save:', err);
        }
      }

      // 지정된 폴더가 있으면 해당 폴더에 즉시 저장
      if (dirHandle && window.showDirectoryPicker) {
        try {
          if (typeof dirHandle.queryPermission === 'function') {
            let perm = await dirHandle.queryPermission({ mode: 'readwrite' });
            if (perm !== 'granted') {
              perm = await dirHandle.requestPermission({ mode: 'readwrite' });
              if (perm !== 'granted') throw new Error('Permission denied');
            }
          }

          // 해당 폴더 안에 시간별 새 파일 생성
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(jsonStr);
          await writable.close();

          updateSaveDirectoryUI(dirHandle.name);

          // 버튼 시각 피드백
          const btnText = document.getElementById('saveButtonText');
          if (btnText) {
            const originalText = btnText.textContent;
            btnText.textContent = '저장 완료! ✓';
            setTimeout(() => {
              btnText.textContent = originalText;
            }, 1800);
          }

          // 상단 플로팅 토스트 표시 (화면 흐름을 끊지 않고 즉시 확인)
          showSaveToast(`💾 <b>[${dirHandle.name}]</b> 폴더에 바로 저장되었습니다!<br><span class="text-[11px] opacity-80 font-normal">📄 ${filename}</span>`, true);
          return;
        } catch (err) {
          console.warn('save to directory handle error, falling back:', err);
        }
      }

      // 폴더 미지정 상태이거나 File System Access 미지원 브라우저인 경우 표준 다운로드
      window.exportStandardDownload();
      const btnText = document.getElementById('saveButtonText');
      if (btnText) {
        const originalText = btnText.textContent;
        btnText.textContent = '저장 완료! ✓';
        setTimeout(() => {
          btnText.textContent = originalText;
        }, 1800);
      }
      showSaveToast(`📥 다운로드 폴더에 저장되었습니다!<br><span class="text-[11px] opacity-80 font-normal">📄 ${filename}</span>`, true);
    };

    // 저장된 폴더 핸들이 있으면 시작 시 UI에 반영
    getSavedDirHandle().then(handle => {
      if (handle && handle.name) updateSaveDirectoryUI(handle.name);
    });

    window.exportFullBackupJson = window.handleMainSaveButtonClick;
    document.getElementById('btnExportFullBackupJson')?.addEventListener('click', window.exportFullBackupJson);

    // Restore from JSON (Available globally for header, dropzone and modal)
    window.importBackupJsonFile = function(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        let json;
        try {
          let rawText = event.target.result;
          if (typeof rawText === 'string') {
            if (rawText.charCodeAt(0) === 0xFEFF) {
              rawText = rawText.slice(1);
            }
            rawText = rawText.trim();
          }
          json = JSON.parse(rawText);
        } catch (parseErr) {
          console.error('JSON Syntax Parse Error:', parseErr);
          alert('❌ 백업 파일 파싱 실패 (JSON 형식 오류):\n' + parseErr.message + '\n\n올바른 .json 형식의 백업 파일인지 확인해주세요.');
          return;
        }

        try {
          if (!json || typeof json !== 'object') {
            alert('올바른 백업 JSON 파일 형식이 아닙니다 (내용이 비어있거나 올바른 데이터 객체가 아닙니다).');
            return;
          }

          // 감싸진 형태 풀기 (예: { MultiState: { ... } } 또는 { multiState: { ... } })
          if (json.MultiState && typeof json.MultiState === 'object') json = json.MultiState;
          else if (json.multiState && typeof json.multiState === 'object') json = json.multiState;
          else if (json.state && typeof json.state === 'object') json = json.state;
          else if (json.appState && typeof json.appState === 'object') json = json.appState;
          else if (json.AppState && typeof json.AppState === 'object') json = json.AppState;

          if (json.data || json.yearsList || json.academicYearsList || json.curriculumByAcademicYear || json.curriculum || json.students || json.sem1Subjects) {
            applyExternalMultiState(json, true);
            closeCloudModal();
          } else {
            alert('올바른 백업 JSON 파일 형식이 아닙니다.\n(필수 백업 항목인 data, yearsList, students 등을 찾을 수 없습니다)');
          }
        } catch (applyErr) {
          console.error('Data Restore Application Error:', applyErr);
          alert('❌ 백업 데이터 복원 적용 실패:\n' + applyErr.message + '\n\n백업 데이터를 화면에 반영하는 중 오류가 발생했습니다.');
        }
      };
      reader.readAsText(file, 'UTF-8');
    };
    document.getElementById('inputRestoreBackupJson')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) window.importBackupJsonFile(file);
      e.target.value = '';
    });

    // Reset active grade only
    document.getElementById('btnResetActiveGradeOnly')?.addEventListener('click', () => {
      if (!confirm(`현재 [${MultiState.activeGrade}]의 학생 명단, 선택과목 매트릭스, 사전데이터 및 그룹핑 결과를 모두 초기화하시겠습니까?`)) return;
      window.resetCurrentGradeClean(MultiState.activeGrade);
      closeCloudModal();
      alert(`[${MultiState.activeGrade}] 데이터가 완전히 초기화되었습니다.`);
    });

    // ==========================================