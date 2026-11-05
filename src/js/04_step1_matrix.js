    // 3. STEP 1: MATRIX VIEW LOGIC
    // ==========================================

    navTab1?.addEventListener('click', () => switchStepView(1));
    navTab2?.addEventListener('click', () => switchStepView(2));

        function switchStepView(step) {
      const uploadSection = document.getElementById('uploadSection');
      const allGradesSection = document.getElementById('allGradesSection');
      const appBody = document.getElementById('appBody');
      const step1View = document.getElementById('step1View');
      const step2View = document.getElementById('step2View');
      const step3View = document.getElementById('step3View');

      if (step === 1 || step === 2) {
        MultiState._lastStep1Or2 = step;
      }

      // '전체 시수종합' 상태에서 단계(1·2·3단계) 전환 시 마지막 학년(기본 2학년) 컨텍스트를 먼저 복원
      if (MultiState.activeGrade === '전체') {
        const restoreGrade = (MultiState._lastActiveGrade === '3학년') ? '3학년' : '2학년';
        MultiState.activeStep = step;
        switchAcademicContext(MultiState.activeYear, restoreGrade, false);
        if (step !== 3) return;
      }

      MultiState.activeStep = step;

      if (step === 3) {
        // [3단계: 이수과목 검증] 단독 집중 모드
        if (allGradesSection) allGradesSection.classList.add('hidden');
        if (uploadSection) uploadSection.classList.add('hidden');
        if (appBody) appBody.classList.remove('hidden');
        if (step1View) step1View.classList.add('hidden');
        if (step2View) step2View.classList.add('hidden');
        if (step3View) step3View.classList.remove('hidden');

        // 3단계 진입 시 필터 초기화
        if (typeof _step3ResultFilters !== 'undefined' && _step3ResultFilters) {
          _step3ResultFilters.grade = (MultiState.activeGrade === '2학년' || MultiState.activeGrade === '3학년') ? MultiState.activeGrade : 'all';
          _step3ResultFilters.status = 'all';
        }
        if (typeof runStep3Validation === 'function') {
          runStep3Validation(false);
        } else if (typeof renderStep3UI === 'function') {
          renderStep3UI();
        }
      } else if (step === 1) {
        // [1단계: 선택 매트릭스]
        if (allGradesSection) allGradesSection.classList.add('hidden');
        if (uploadSection && MultiState.activeGrade !== '전체') uploadSection.classList.remove('hidden');
        if (step3View) step3View.classList.add('hidden');
        if (step2View) step2View.classList.add('hidden');
        if (step1View) step1View.classList.remove('hidden');
        if (AppState.students && AppState.students.length > 0) {
          if (appBody) appBody.classList.remove('hidden');
          if (typeof renderStep1 === 'function') renderStep1();
        } else {
          if (appBody) appBody.classList.add('hidden');
        }
      } else if (step === 2) {
        // [2단계: 그룹핑 & 시간표]
        if (allGradesSection) allGradesSection.classList.add('hidden');
        if (uploadSection && MultiState.activeGrade !== '전체') uploadSection.classList.remove('hidden');
        if (step3View) step3View.classList.add('hidden');
        if (step1View) step1View.classList.add('hidden');
        if (step2View) step2View.classList.remove('hidden');
        if (AppState.students && AppState.students.length > 0) {
          if (appBody) appBody.classList.remove('hidden');
          if (typeof renderStep2UI === 'function') renderStep2UI();
        } else {
          if (appBody) appBody.classList.add('hidden');
        }
      }

      renderYearGradeNav();
      if (typeof updateStep2ContextMemoUI === 'function') updateStep2ContextMemoUI();
      if (typeof saveAllState === 'function') saveAllState();
    }
    window.switchStepView = switchStepView;

    function toggleStep3OrStep1() {
      if (MultiState.activeGrade !== '전체' && MultiState.activeStep === 3) {
        window.switchStepView(MultiState._lastStep1Or2 || 1);
      } else {
        window.switchStepView(3);
      }
    }
    window.toggleStep3OrStep1 = toggleStep3OrStep1;

    // 2학년 / 3학년 메뉴 클릭 시: 이수과목 검증(3단계) 또는 전체 시수종합 모드를 해제하고 1·2학기 및 1·2단계를 즉시 활성화
    window.selectGradeTabFromNav = function(targetYear, targetGrade) {
      if (MultiState.activeStep === 3) {
        MultiState.activeStep = MultiState._lastStep1Or2 || 1;
      }
      window.switchAcademicContext(targetYear, targetGrade);
    };


    function switchSemester(sem) {
      if (MultiState.activeGrade === '전체') return;

      // 이전 학기 메모 보존
      const memoEl = document.getElementById('step2ContextMemo');
      if (memoEl) {
        const prevSem = AppState.currentSemester || 1;
        if (!AppState.step2Memos) AppState.step2Memos = { 1: '', 2: '' };
        AppState.step2Memos[prevSem] = memoEl.value;
      }

      // 1. 현재 학기의 유효한 배치 상태만 currentPlans에 보존
      if (!AppState.currentPlans) AppState.currentPlans = { 1: null, 2: null };
      if (AppState.currentPlan && isPlanValidForCurrentGrade(AppState.currentPlan, AppState.currentSemester)) {
        AppState.currentPlans[AppState.currentSemester] = JSON.parse(JSON.stringify(AppState.currentPlan));
      }

      AppState.currentSemester = sem;
      updateStep1SemesterTabs(sem);
      updateStep2SemesterTabs(sem);

      // 2. 대상 학기(sem)의 유효한 플랜 확인 및 복원
      let targetPlan = null;
      if (AppState.currentPlans[sem] && isPlanValidForCurrentGrade(AppState.currentPlans[sem], sem)) {
        targetPlan = AppState.currentPlans[sem];
      } else {
        const validSaved = (AppState.savedPlans || []).filter(p => p.semester === sem && isPlanValidForCurrentGrade(p, sem));
        if (validSaved.length > 0) {
          targetPlan = JSON.parse(JSON.stringify(validSaved[validSaved.length - 1]));
        }
      }

      if (targetPlan) {
        AppState.currentPlan = targetPlan;
        AppState.currentPlans[sem] = targetPlan;
      } else {
        AppState.currentPlan = null;
      }

      if (MultiState.activeStep === 1) {
        renderStep1();
      } else {
        initStep2Controls();
        if (AppState.currentPlan) {
          renderStep2Results();
        } else {
          // 해당 학기에 유효한 플랜이 없을 때만 새로 생성
          runOptimization();
        }
      }
      renderYearGradeNav();
      saveAllState();
    }
    window.switchSemester = switchSemester;

    function updateStep1SemesterTabs(sem) {
      const activeCls = 'px-5 py-2.5 sm:px-6 sm:py-2.5 text-sm sm:text-base font-black rounded-lg bg-blue-600 text-white shadow-md ring-2 ring-blue-300 transition-all cursor-pointer flex items-center gap-2';
      const inactiveCls = 'px-5 py-2.5 sm:px-6 sm:py-2.5 text-sm sm:text-base font-bold rounded-lg text-slate-600 hover:text-blue-700 hover:bg-white/80 transition-all cursor-pointer flex items-center gap-2';
      if (sem1TabBtn && sem2TabBtn) {
        if (sem === 1) {
          sem1TabBtn.className = activeCls;
          sem2TabBtn.className = inactiveCls;
        } else {
          sem2TabBtn.className = activeCls;
          sem1TabBtn.className = inactiveCls;
        }
      }
    }

    sem1TabBtn?.addEventListener('click', () => {
      switchSemester(1);
    });

    sem2TabBtn?.addEventListener('click', () => {
      switchSemester(2);
    });

    thresholdInput.addEventListener('input', (e) => {
      AppState.step1Threshold = parseInt(e.target.value, 10) || 0;
      renderStep1();
      saveAllState();
    });

    studentSearchInput.addEventListener('input', () => {
      renderStep1TableOnly();
    });

    document.getElementById('step1SubjectSortSelect')?.addEventListener('change', () => {
      renderStep1TableOnly();
      renderSubjectSummaryTable();
    });

    document.getElementById('step1SubjectFilterSelect')?.addEventListener('change', () => {
      renderStep1TableOnly();
      renderSubjectSummaryTable();
    });

    document.getElementById('step1TargetSubjectFilter')?.addEventListener('change', (e) => {
      step1TableSortState.subjectFilter = e.target.value;
      renderStep1TableOnly();
    });

    // 1단계 학생 매트릭스 테이블 정렬 및 과목 필터 상태 관리
    const step1TableSortState = {
      sortCol: 'default', // 'default' | 'classNum' | 'studentNum' | 'name' | 'career' | subjectName
      sortDir: 'asc',     // 'asc' | 'desc'
      subjectFilter: 'all' // 'all' | subjectName
    };

    window.handleStep1SubjectColClick = function(sName) {
      if (step1TableSortState.sortCol !== sName) {
        step1TableSortState.sortCol = sName;
        step1TableSortState.sortDir = 'asc'; // 1차 클릭: 선택자 우선 정렬 (오름차순)
      } else if (step1TableSortState.sortDir === 'asc') {
        step1TableSortState.sortDir = 'desc'; // 2차 클릭: 미선택자 우선 정렬 (내림차순)
      } else {
        step1TableSortState.sortCol = 'default'; // 3차 클릭: 기본 반/번호 순 복귀
        step1TableSortState.sortDir = 'asc';
      }
      renderStep1TableOnly();
    };

    window.handleStep1ColHeaderClick = function(colKey) {
      if (step1TableSortState.sortCol !== colKey) {
        step1TableSortState.sortCol = colKey;
        step1TableSortState.sortDir = 'asc';
      } else if (step1TableSortState.sortDir === 'asc') {
        step1TableSortState.sortDir = 'desc';
      } else {
        step1TableSortState.sortCol = 'default';
        step1TableSortState.sortDir = 'asc';
      }
      renderStep1TableOnly();
    };

    window.resetStep1TableSort = function() {
      step1TableSortState.sortCol = 'default';
      step1TableSortState.sortDir = 'asc';
      step1TableSortState.subjectFilter = 'all';
      const subjFilterSel = document.getElementById('step1TargetSubjectFilter');
      if (subjFilterSel) subjFilterSel.value = 'all';
      renderStep1TableOnly();
    };

    window.cycleStep1SubjectSort = function(type) {
      const sortSelect = document.getElementById('step1SubjectSortSelect');
      if (!sortSelect) return;
      const current = sortSelect.value;
      if (type === 'name') {
        sortSelect.value = (current === 'name_asc') ? 'name_desc' : 'name_asc';
      } else if (type === 'count') {
        sortSelect.value = (current === 'count_desc') ? 'count_asc' : 'count_desc';
      }
      renderStep1TableOnly();
      renderSubjectSummaryTable();
    };

    function getFilteredAndSortedStep1Subjects(sem, counts) {
      const baseSubjects = sem === 1 ? (AppState.sem1Subjects || []) : (AppState.sem2Subjects || []);
      const threshold = AppState.step1Threshold;
      const closedList = AppState.closedSubjects?.[sem] || [];
      const sortMode = document.getElementById('step1SubjectSortSelect')?.value || 'default';
      const filterMode = document.getElementById('step1SubjectFilterSelect')?.value || 'all';

      // 1. Filter
      let result = baseSubjects.filter(s => {
        const count = counts[s] || 0;
        const normS = normalizeSubject(s);
        const isClosed = closedList.some(c => normalizeSubject(c) === normS);
        const isUnder = count <= threshold;

        if (filterMode === 'opened') {
          return !isClosed && !isUnder;
        } else if (filterMode === 'under') {
          return !isClosed && isUnder;
        } else if (filterMode === 'closed') {
          return isClosed;
        }
        return true; // 'all'
      });

      // 2. Sort
      result.sort((a, b) => {
        if (sortMode === 'name_asc') {
          return a.localeCompare(b, 'ko');
        } else if (sortMode === 'name_desc') {
          return b.localeCompare(a, 'ko');
        } else if (sortMode === 'count_desc') {
          const diff = (counts[b] || 0) - (counts[a] || 0);
          return diff !== 0 ? diff : a.localeCompare(b, 'ko');
        } else if (sortMode === 'count_asc') {
          const diff = (counts[a] || 0) - (counts[b] || 0);
          return diff !== 0 ? diff : a.localeCompare(b, 'ko');
        }
        // 'default' - preserve original order in baseSubjects
        return baseSubjects.indexOf(a) - baseSubjects.indexOf(b);
      });

      return result;
    }

    // ==========================================
    // Student Choice Modification & Audit Trail (수강신청 선택 과목 수정 및 변경 이력 관리)
    // ==========================================
    function getStudentOriginalChoices(st, sem) {
      if (!st) return [];
      if (sem === 1) {
        if (!st.origSem1) st.origSem1 = [...(st.sem1 || [])];
        return st.origSem1;
      } else {
        if (!st.origSem2) st.origSem2 = [...(st.sem2 || [])];
        return st.origSem2;
      }
    }

    function getStudentActiveChoices(st, sem) {
      if (!st) return [];
      return sem === 1 ? (st.sem1 || []) : (st.sem2 || []);
    }

    function isStudentChoicesModified(st, sem) {
      if (!st) return false;
      const orig = getStudentOriginalChoices(st, sem);
      const active = getStudentActiveChoices(st, sem);
      if (orig.length !== active.length) return true;
      const setA = new Set(orig.map(s => normalizeSubject(s)));
      for (const s of active) {
        if (!setA.has(normalizeSubject(s))) return true;
      }
      return false;
    }

    window.toggleStudentSubjectSelection = function(studentId, subjectName, semester) {
      const sem = semester || AppState.currentSemester || 1;
      const st = (AppState.students || []).find(s => s.id === studentId);
      if (!st) return;

      // Ensure orig baseline is initialized
      if (!st.origSem1) st.origSem1 = [...(st.sem1 || [])];
      if (!st.origSem2) st.origSem2 = [...(st.sem2 || [])];

      const active = sem === 1 ? st.sem1 : st.sem2;
      const normTarget = normalizeSubject(subjectName);
      const idx = active.findIndex(s => normalizeSubject(s) === normTarget);

      if (idx !== -1) {
        // Active -> Remove (cancelled or un-added)
        active.splice(idx, 1);
      } else {
        // Inactive -> Add (restored or newly added)
        active.push(subjectName);
        active.sort();
      }

      // If current plan exists, cleanup customAssignments for this student if needed
      if (AppState.currentPlan && AppState.currentPlan.customAssignments && AppState.currentPlan.customAssignments[studentId]) {
        if (idx !== -1) {
          const custom = AppState.currentPlan.customAssignments[studentId];
          Object.keys(custom).forEach(g => {
            custom[g] = custom[g].filter(s => normalizeSubject(s.replace(/-[A-Z]$/, '')) !== normTarget);
          });
        }
      }

      runCrossCheckAnalysis();
      saveAllState();

      // Always re-render Step 1
      renderStep1();

      // If Step 2 currentPlan exists, re-analyze conflicts and re-render
      if (AppState.currentPlan) {
        renderStep2Results();
      }

      // If modal is open, re-render modal content
      if (currentModalStudentId === studentId) {
        renderStudentChoiceEditModalContent();
      }

      // Step 3 검증 캐시 무효화 및 실시간 재검증
      window._step3LastValidationResult = null;
      if (typeof runStep3Validation === 'function') {
        runStep3Validation(false);
      }
      renderYearGradeNav();
    };

    window.revertStudentChoices = function(studentId, semester) {
      const sem = semester || AppState.currentSemester || 1;
      const st = (AppState.students || []).find(s => s.id === studentId);
      if (!st) return;

      if (sem === 1) {
        if (!st.origSem1 && st.sem1) st.origSem1 = [...st.sem1];
        if (st.origSem1) st.sem1 = [...st.origSem1];
      } else {
        if (!st.origSem2 && st.sem2) st.origSem2 = [...st.sem2];
        if (st.origSem2) st.sem2 = [...st.origSem2];
      }

      if (AppState.currentPlan && AppState.currentPlan.customAssignments) {
        delete AppState.currentPlan.customAssignments[studentId];
      }

      runCrossCheckAnalysis();
      saveAllState();
      renderStep1();
      if (AppState.currentPlan) {
        renderStep2Results();
      }
      if (currentModalStudentId === studentId) {
        renderStudentChoiceEditModalContent();
      }

      // Step 3 검증 캐시 무효화 및 실시간 재검증
      window._step3LastValidationResult = null;
      if (typeof runStep3Validation === 'function') {
        runStep3Validation(false);
      }
      renderYearGradeNav();
    };

    window.handleStudentEditModalRevert = function() {
      if (!currentModalStudentId) return;
      window.revertStudentChoices(currentModalStudentId, currentModalSemester);
    };

    window.revertAllStudentsChoices = function(semester) {
      const sem = semester || AppState.currentSemester || 1;
      const modifiedCount = (AppState.students || []).filter(st => isStudentChoicesModified(st, sem)).length;
      if (modifiedCount === 0) {
        alert(`${sem}학기에 수정된 학생 선택 내역이 없습니다.`);
        return;
      }

      if (!confirm(`[${sem}학기] 수정된 ${modifiedCount}명 학생의 선택 과목을 모두 원본(엑셀 업로드 시점)으로 복원하시겠습니까?`)) {
        return;
      }

      (AppState.students || []).forEach(st => {
        if (sem === 1 && st.origSem1) {
          st.sem1 = [...st.origSem1];
        } else if (sem === 2 && st.origSem2) {
          st.sem2 = [...st.origSem2];
        }
      });

      if (AppState.currentPlan) {
        AppState.currentPlan.customAssignments = {};
      }

      runCrossCheckAnalysis();
      saveAllState();
      renderStep1();
      if (AppState.currentPlan) {
        renderStep2Results();
      }
      // Step 3 검증 캐시 무효화 및 실시간 재검증
      window._step3LastValidationResult = null;
      if (typeof runStep3Validation === 'function') {
        runStep3Validation(false);
      }
      renderYearGradeNav();

      alert(`✅ [${sem}학기] ${modifiedCount}명 학생의 선택 과목이 모두 원본으로 복원되었습니다.`);
    };

    let currentModalStudentId = null;
    let currentModalSemester = null;

    window.openStudentChoiceEditModal = function(studentId, semester) {
      const sem = semester || AppState.currentSemester || 1;
      const st = (AppState.students || []).find(s => s.id === studentId);
      if (!st) return;

      currentModalStudentId = studentId;
      currentModalSemester = sem;

      const modal = document.getElementById('studentChoiceEditModal');
      const titleEl = document.getElementById('studentEditModalTitle');
      const subtitleEl = document.getElementById('studentEditModalSubtitle');

      if (titleEl) {
        titleEl.textContent = `${st.classNum}반 ${st.studentNum}번 ${st.name} - ${sem}학기 선택 과목 수정`;
      }
      if (subtitleEl) {
        subtitleEl.textContent = `진로/희망: ${st.career || '미기재'} | 과목 카드를 클릭하여 추가하거나 취소할 수 있습니다.`;
      }

      renderStudentChoiceEditModalContent();
      modal?.classList.remove('hidden');
    };

    window.closeStudentChoiceEditModal = function() {
      document.getElementById('studentChoiceEditModal')?.classList.add('hidden');
      currentModalStudentId = null;
      currentModalSemester = null;
    };
    // ==========================================
    // ADD MISSING OR ARBITRARY STUDENT MODAL LOGIC (수강신청 미수행자 및 임의 학생 추가)
    // ==========================================
    let _addStudentModalState = {
      activeSem: 1,
      selectedSem1: [],
      selectedSem2: [],
      selectedMissingKey: ''
    };

    window.openAddStudentModal = function() {
      if (typeof runCrossCheckAnalysis === 'function') {
        runCrossCheckAnalysis();
      }
      const sem = (AppState.currentPlan && AppState.currentPlan.semester) || AppState.currentSemester || 1;
      _addStudentModalState = {
        activeSem: sem,
        selectedSem1: [],
        selectedSem2: [],
        selectedMissingKey: ''
      };

      const curGrade = AppState.detectedGrade || MultiState.activeGrade || '3학년';
      const gradeBadgeEl = document.getElementById('addStudentGradeBadge');
      if (gradeBadgeEl) gradeBadgeEl.textContent = curGrade;

      window.resetAddStudentForm();
      renderAddStudentMissingList();
      renderAddStudentSubjectsGrid();

      document.getElementById('addStudentModal')?.classList.remove('hidden');
    };

    window.openAddStudentModalWithPreset = function(classNum, studentNum, name) {
      window.openAddStudentModal();
      window.selectMissingStudentForAdd(classNum, studentNum, name);
    };

    window.closeAddStudentModal = function() {
      document.getElementById('addStudentModal')?.classList.add('hidden');
    };

    window.resetAddStudentForm = function() {
      _addStudentModalState.selectedSem1 = [];
      _addStudentModalState.selectedSem2 = [];
      _addStudentModalState.selectedMissingKey = '';

      const clsInp = document.getElementById('addStudentClassInput');
      const numInp = document.getElementById('addStudentNumInput');
      const nameInp = document.getElementById('addStudentNameInput');
      const careerInp = document.getElementById('addStudentCareerInput');

      if (clsInp) clsInp.value = '';
      if (numInp) numInp.value = '';
      if (nameInp) nameInp.value = '';
      if (careerInp) careerInp.value = '';

      renderAddStudentMissingList();
      renderAddStudentSubjectsGrid();
    };

    function getMissingStudentsForCurrentGrade() {
      if (typeof runCrossCheckAnalysis === 'function') {
        runCrossCheckAnalysis();
      }
      if (AppState.crossCheckResult && Array.isArray(AppState.crossCheckResult.missingStudents)) {
        return AppState.crossCheckResult.missingStudents;
      }
      return [];
    }

    function renderAddStudentMissingList() {
      const container = document.getElementById('addStudentMissingListContainer');
      const badge = document.getElementById('addStudentMissingCountBadge');
      const addAllBtn = document.getElementById('btnAddAllMissingStudents');
      if (!container) return;

      const missingList = getMissingStudentsForCurrentGrade();
      const hasPrior = !!(AppState.priorData && AppState.priorData.students && AppState.priorData.students.length > 0);

      if (badge) {
        badge.textContent = hasPrior ? `${missingList.length}명` : '사전명부 미등록';
      }
      if (addAllBtn) {
        if (missingList.length > 0) addAllBtn.classList.remove('hidden');
        else addAllBtn.classList.add('hidden');
      }

      if (!hasPrior) {
        container.innerHTML = `
          <div class="p-3 text-center text-xs text-slate-500 bg-white/80 rounded-xl border border-rose-100">
            ℹ️ 1단계에 등록된 사전 명부(NEIS 학생 명부)가 없습니다. 아래 <strong>2. 학생 인적사항 입력</strong>에서 반·번호·이름을 직접 입력해 임의로 추가할 수 있습니다.
          </div>
        `;
        return;
      }

      if (missingList.length === 0) {
        container.innerHTML = `
          <div class="p-3 text-center text-xs font-bold text-emerald-700 bg-emerald-50/80 rounded-xl border border-emerald-200">
            ✅ 사전 명부의 모든 학생이 이미 추가되었거나 수강신청을 완료했습니다! (미수행자 0명)<br/>
            <span class="font-normal text-[11px] text-slate-500">명부에 없는 전입생 등도 아래 입력란에서 임의로 추가할 수 있습니다.</span>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          ${missingList.map(st => {
            const key = `${st.classNum}_${st.studentNum}_${st.name}`;
            const isSelected = (_addStudentModalState.selectedMissingKey === key);
            const safeName = String(st.name || '').replace(/'/g, "\\'");
            return `
              <div onclick="window.selectMissingStudentForAdd('${st.classNum}', '${st.studentNum}', '${safeName}')"
                   class="p-2 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 select-none ${isSelected ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300 shadow-xs' : 'bg-white hover:bg-rose-100/50 border-rose-200'}">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-black text-[10px] shrink-0">${st.classNum}반 ${st.studentNum}번</span>
                  <span class="text-xs font-black text-slate-900 truncate">${st.name}</span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  ${isSelected ? '<span class="text-[10px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">선택됨 ✓</span>' : '<span class="text-[10px] text-slate-400 font-semibold">클릭 선택</span>'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    window.selectMissingStudentForAdd = function(classNum, studentNum, name) {
      const clsClean = String(classNum || '').replace(/[^0-9]/g, '');
      const numClean = String(studentNum || '').replace(/[^0-9]/g, '');
      _addStudentModalState.selectedMissingKey = `${classNum}_${studentNum}_${name}`;

      const clsInp = document.getElementById('addStudentClassInput');
      const numInp = document.getElementById('addStudentNumInput');
      const nameInp = document.getElementById('addStudentNameInput');
      const careerInp = document.getElementById('addStudentCareerInput');

      if (clsInp) clsInp.value = clsClean;
      if (numInp) numInp.value = numClean;
      if (nameInp) nameInp.value = name || '';
      if (careerInp && !careerInp.value) careerInp.value = '탐색중';

      renderAddStudentMissingList();
    };

    window.switchAddStudentModalSem = function(sem) {
      _addStudentModalState.activeSem = sem;
      renderAddStudentSubjectsGrid();
    };

    window.toggleAddStudentModalSubject = function(subjName) {
      const sem = _addStudentModalState.activeSem;
      const list = sem === 1 ? _addStudentModalState.selectedSem1 : _addStudentModalState.selectedSem2;
      const idx = list.indexOf(subjName);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        list.push(subjName);
      }
      renderAddStudentSubjectsGrid();
    };

    function renderAddStudentSubjectsGrid() {
      const sem = _addStudentModalState.activeSem || 1;
      const tab1 = document.getElementById('addStudentSem1Tab');
      const tab2 = document.getElementById('addStudentSem2Tab');
      const cnt1 = document.getElementById('addStudentSem1Count');
      const cnt2 = document.getElementById('addStudentSem2Count');
      const grid = document.getElementById('addStudentSubjectsGrid');

      if (cnt1) cnt1.textContent = _addStudentModalState.selectedSem1.length;
      if (cnt2) cnt2.textContent = _addStudentModalState.selectedSem2.length;

      const activeTabCls = 'px-3 py-1 rounded-lg text-xs font-black bg-white text-indigo-700 shadow-2xs transition cursor-pointer';
      const inactiveTabCls = 'px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer';
      if (tab1) tab1.className = sem === 1 ? activeTabCls : inactiveTabCls;
      if (tab2) tab2.className = sem === 2 ? activeTabCls : inactiveTabCls;

      if (!grid) return;

      const rawSubjects = sem === 1 ? (AppState.sem1Subjects || []) : (AppState.sem2Subjects || []);
      const closedList = AppState.closedSubjects?.[sem] || [];
      const closedNorms = new Set(closedList.map(s => normalizeSubject(s)));
      const openSubjects = rawSubjects.filter(s => !closedNorms.has(normalizeSubject(s)));
      const selectedList = sem === 1 ? _addStudentModalState.selectedSem1 : _addStudentModalState.selectedSem2;

      // Map subject -> group index if a Step 2 plan exists for this semester
      const planForSem = (AppState.currentPlan && AppState.currentPlan.semester === sem)
        ? AppState.currentPlan
        : (AppState.currentPlans && AppState.currentPlans[sem]);
      const subjGroupMap = {};
      if (planForSem && Array.isArray(planForSem.groups)) {
        planForSem.groups.forEach((gSubjs, gIdx) => {
          (gSubjs || []).forEach(tok => {
            const parent = tok.replace(/-[A-Z]$/, '');
            if (!subjGroupMap[parent]) subjGroupMap[parent] = [];
            if (!subjGroupMap[parent].includes(`${gIdx + 1}그룹`)) {
              subjGroupMap[parent].push(`${gIdx + 1}그룹`);
            }
          });
        });
      }

      if (openSubjects.length === 0) {
        grid.innerHTML = '<div class="col-span-full p-4 text-center text-xs text-slate-400">개설된 선택과목이 없습니다.</div>';
        return;
      }

      grid.innerHTML = openSubjects.map(subj => {
        const isChecked = selectedList.includes(subj);
        const grpLabels = subjGroupMap[subj] ? subjGroupMap[subj].join('·') : '';
        const safeS = subj.replace(/'/g, "\\'");
        return `
          <div onclick="window.toggleAddStudentModalSubject('${safeS}')"
               class="p-2 rounded-xl border text-xs flex items-center justify-between gap-1.5 cursor-pointer select-none transition ${isChecked ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-black shadow-2xs' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-medium'}">
            <div class="flex items-center gap-1.5 min-w-0 truncate">
              <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); window.toggleAddStudentModalSubject('${safeS}')" class="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0" />
              <span class="truncate" title="${subj}">${subj}</span>
            </div>
            ${grpLabels ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-bold ${isChecked ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-100 text-slate-500'} shrink-0">${grpLabels}</span>` : ''}
          </div>
        `;
      }).join('');
    }

    function sortStudentsByClassAndNum() {
      if (!Array.isArray(AppState.students)) return;
      AppState.students.sort((a, b) => {
        const cA = parseInt(String(a.classNum).replace(/[^0-9]/g, ''), 10) || 0;
        const cB = parseInt(String(b.classNum).replace(/[^0-9]/g, ''), 10) || 0;
        if (cA !== cB) return cA - cB;
        const nA = parseInt(String(a.studentNum).replace(/[^0-9]/g, ''), 10) || 0;
        const nB = parseInt(String(b.studentNum).replace(/[^0-9]/g, ''), 10) || 0;
        return nA - nB;
      });
    }

    window.confirmAddStudent = function() {
      const clsRaw = (document.getElementById('addStudentClassInput')?.value || '').trim();
      const numRaw = (document.getElementById('addStudentNumInput')?.value || '').trim();
      const nameVal = (document.getElementById('addStudentNameInput')?.value || '').trim();
      const careerVal = (document.getElementById('addStudentCareerInput')?.value || '').trim() || '탐색중';

      const clsClean = clsRaw.replace(/[^0-9]/g, '');
      const numClean = numRaw.replace(/[^0-9]/g, '');

      if (!clsClean || !numClean || !nameVal) {
        alert('학생의 [반], [번호], [이름]을 모두 입력해주세요.');
        return;
      }

      if (!Array.isArray(AppState.students)) AppState.students = [];

      // 중복 학생 확인
      const existing = AppState.students.find(st =>
        String(st.classNum).replace(/[^0-9]/g, '') === clsClean &&
        String(st.studentNum).replace(/[^0-9]/g, '') === numClean &&
        st.name.trim() === nameVal
      );
      if (existing) {
        alert(`이미 [${clsClean}반 ${numClean}번 ${nameVal}] 학생이 명단에 존재합니다. 해당 학생의 과목 수정 창을 엽니다.`);
        window.closeAddStudentModal();
        const sem = (AppState.currentPlan && AppState.currentPlan.semester) || AppState.currentSemester || 1;
        window.openStudentChoiceEditModal(existing.id, sem);
        return;
      }

      const curGrade = AppState.detectedGrade || MultiState.activeGrade || '3학년';
      const newStudent = {
        id: 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        grade: curGrade,
        classNum: clsClean,
        studentNum: numClean,
        name: nameVal,
        career: careerVal,
        sem1: [..._addStudentModalState.selectedSem1].sort(),
        sem2: [..._addStudentModalState.selectedSem2].sort(),
        origSem1: [],
        origSem2: [],
        isNewlyAdded: true
      };

      AppState.students.push(newStudent);
      sortStudentsByClassAndNum();

      // Step 3 검증 필터를 전체 학생 및 추가된 학생 학년으로 맞춤
      if (typeof _step3ResultFilters !== 'undefined' && _step3ResultFilters) {
        _step3ResultFilters.status = 'all';
        _step3ResultFilters.grade = curGrade;
        _step3ResultFilters.classNum = 'all';
        _step3ResultFilters.search = '';
      }

      runCrossCheckAnalysis();
      renderStep1();
      if (AppState.currentPlan) {
        renderStep2Results();
      }
      saveAllState();

      // Step 3 검증 캐시 무효화 및 실시간 재검증
      window._step3LastValidationResult = null;
      if (typeof runStep3Validation === 'function') {
        runStep3Validation(false);
      }
      renderYearGradeNav();

      window.closeAddStudentModal();

      // Scroll to the newly added student row in Step 2 timetable and highlight it
      setTimeout(() => {
        const rowEl = document.getElementById(`step2-student-row-${newStudent.id}`);
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          rowEl.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50');
          setTimeout(() => {
            rowEl.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50');
          }, 3000);
        }
      }, 100);
    };

    window.addAllMissingStudentsAtOnce = function() {
      const missingList = getMissingStudentsForCurrentGrade();
      if (missingList.length === 0) {
        alert('추가할 미수행 학생이 없습니다.');
        return;
      }
      if (!confirm(`1단계 수강신청 미수행자 명단의 학생 ${missingList.length}명을 모두 시간표 명단에 일괄 추가하시겠습니까?\n(추가 후 시간표에서 각 학생의 선택과목을 클릭하여 입력할 수 있습니다.)`)) {
        return;
      }

      const curGrade = AppState.detectedGrade || MultiState.activeGrade || '3학년';
      let addedCount = 0;
      let lastAddedId = null;

      missingList.forEach(mSt => {
        const clsClean = String(mSt.classNum || '').replace(/[^0-9]/g, '') || '1';
        const numClean = String(mSt.studentNum || '').replace(/[^0-9]/g, '') || '1';
        const nameVal = String(mSt.name || '').trim();
        if (!nameVal) return;

        const exists = (AppState.students || []).some(st =>
          String(st.classNum).replace(/[^0-9]/g, '') === clsClean &&
          String(st.studentNum).replace(/[^0-9]/g, '') === numClean &&
          st.name.trim() === nameVal
        );
        if (!exists) {
          const newId = 'std_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) + '_' + addedCount;
          AppState.students.push({
            id: newId,
            grade: curGrade,
            classNum: clsClean,
            studentNum: numClean,
            name: nameVal,
            career: '탐색중',
            sem1: [],
            sem2: [],
            origSem1: [],
            origSem2: [],
            isNewlyAdded: true
          });
          lastAddedId = newId;
          addedCount++;
        }
      });

      sortStudentsByClassAndNum();

      // Step 3 검증 필터를 전체 학생 및 추가된 학생 학년으로 맞춤
      if (typeof _step3ResultFilters !== 'undefined' && _step3ResultFilters) {
        _step3ResultFilters.status = 'all';
        _step3ResultFilters.grade = curGrade;
        _step3ResultFilters.classNum = 'all';
        _step3ResultFilters.search = '';
      }

      runCrossCheckAnalysis();
      renderStep1();
      if (AppState.currentPlan) {
        renderStep2Results();
      }
      saveAllState();

      // Step 3 검증 캐시 무효화 및 실시간 재검증
      window._step3LastValidationResult = null;
      if (typeof runStep3Validation === 'function') {
        runStep3Validation(false);
      }
      renderYearGradeNav();

      window.closeAddStudentModal();

      if (addedCount > 0 && lastAddedId) {
        setTimeout(() => {
          const rowEl = document.getElementById(`step2-student-row-${lastAddedId}`);
          if (rowEl) {
            rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 120);
      }
      alert(`✅ 미수행 학생 ${addedCount}명이 명단에 추가되었습니다. 시간표에서 과목 셀(·)이나 ✏️ 버튼을 클릭하여 선택과목을 입력해주세요.`);
    };

    window.deleteAddedStudent = function(studentId) {
      const st = (AppState.students || []).find(s => s.id === studentId);
      if (!st) return;
      if (!confirm(`추가된 [${st.classNum}반 ${st.studentNum}번 ${st.name}] 학생을 명단에서 삭제하시겠습니까?`)) {
        return;
      }
      AppState.students = (AppState.students || []).filter(s => s.id !== studentId);
      if (AppState.currentPlan && AppState.currentPlan.customAssignments) {
        delete AppState.currentPlan.customAssignments[studentId];
      }
      runCrossCheckAnalysis();
      renderStep1();
      if (AppState.currentPlan) {
        renderStep2Results();
      }
      saveAllState();

      // Step 3 검증 캐시 무효화 및 실시간 재검증
      window._step3LastValidationResult = null;
      if (typeof runStep3Validation === 'function') {
        runStep3Validation(false);
      }
      renderYearGradeNav();
    };


    function renderStudentChoiceEditModalContent() {
      if (!currentModalStudentId) return;
      const sem = currentModalSemester;
      const st = (AppState.students || []).find(s => s.id === currentModalStudentId);
      if (!st) return;

      const container = document.getElementById('studentEditSubjectsContainer');
      const countEl = document.getElementById('studentEditSelectedCount');
      if (!container) return;

      const subjects = sem === 1 ? (AppState.sem1Subjects || []) : (AppState.sem2Subjects || []);
      const orig = getStudentOriginalChoices(st, sem);
      const active = getStudentActiveChoices(st, sem);
      const activeNorms = new Set(active.map(s => normalizeSubject(s)));
      const origNorms = new Set(orig.map(s => normalizeSubject(s)));
      const closedNorms = new Set((AppState.closedSubjects?.[sem] || []).map(s => normalizeSubject(s)));

      if (countEl) {
        const expectedCount = sem === 1 ? AppState.sem1GroupCount : AppState.sem2GroupCount;
        countEl.innerHTML = `현재 선택: <span class="text-base font-black ${active.length === expectedCount ? 'text-emerald-600' : 'text-amber-600'}">${active.length}과목</span> <span class="text-xs text-slate-500 font-normal">(기준: ${expectedCount}과목)</span>`;
      }

      const dupSt = (AppState.crossCheckResult && AppState.crossCheckResult.duplicateEnrollments)
        ? AppState.crossCheckResult.duplicateEnrollments.find(d => 
            String(d.classNum).replace(/[^0-9]/g, '') === String(st.classNum).replace(/[^0-9]/g, '') &&
            d.name.trim() === st.name.trim()
          )
        : null;
      const dupItemsThisSem = dupSt ? (dupSt.dupList || []).filter(d => d.semester === sem) : [];

      let html = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">';
      subjects.forEach(s => {
        const normS = normalizeSubject(s);
        const wasOrig = origNorms.has(normS);
        const isAct = activeNorms.has(normS);
        const isClosed = closedNorms.has(normS);
        const matchedDups = dupItemsThisSem.filter(d => d.normalized === normS);
        const dupLabelStr = matchedDups.length > 0 ? Array.from(new Set(matchedDups.map(d => d.sourceLabel))).join(', ') : '';

        let badge = '';
        let cardBg = 'bg-white border-slate-200 hover:border-slate-400';

        if (wasOrig && isAct) {
          cardBg = 'bg-blue-50/70 border-blue-300';
          badge = '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">선택 유지</span>';
        } else if (wasOrig && !isAct) {
          cardBg = 'bg-rose-50/70 border-rose-300';
          badge = '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300 line-through">✕ 취소됨 (집계 제외)</span>';
        } else if (!wasOrig && isAct) {
          cardBg = 'bg-emerald-50/70 border-emerald-300';
          badge = '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">★ 새로 추가</span>';
        } else {
          badge = '<span class="px-2 py-0.5 rounded text-[11px] font-normal text-slate-400">미선택</span>';
        }

        const safeS = s.replace(/'/g, "\\'");
        html += `
          <div onclick="window.handleModalToggleSubject('${safeS}');" class="p-2.5 rounded-xl border ${cardBg} flex items-center justify-between gap-2 cursor-pointer transition select-none shadow-2xs">
            <div class="flex items-center gap-2.5 flex-wrap">
              <input type="checkbox" ${isAct ? 'checked' : ''} onclick="event.stopPropagation(); window.handleModalToggleSubject('${safeS}');" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer">
              <span class="text-xs font-bold ${isAct ? 'text-slate-900' : 'text-slate-500'} ${wasOrig && !isAct ? 'line-through text-rose-600' : ''}">${s}</span>
              ${isClosed ? '<span class="text-[10px] text-rose-600 font-semibold">(폐강)</span>' : ''}
              ${dupLabelStr ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-400" title="⚠️ ${dupLabelStr}">⚠️ ${dupLabelStr}</span>` : ''}
            </div>
            <div>
              ${badge}
            </div>
          </div>
        `;
      });
      html += '</div>';

      container.innerHTML = html;
    }

    window.handleModalToggleSubject = function(sName) {
      if (!currentModalStudentId) return;
      window.toggleStudentSubjectSelection(currentModalStudentId, sName, currentModalSemester);
    };

    document.getElementById('btnStudentEditRevert')?.addEventListener('click', () => {
      if (!currentModalStudentId) return;
      window.revertStudentChoices(currentModalStudentId, currentModalSemester);
    });
    document.getElementById('btnCloseStudentEditModal')?.addEventListener('click', () => window.closeStudentChoiceEditModal());
    document.getElementById('btnStudentEditDone')?.addEventListener('click', () => window.closeStudentChoiceEditModal());
    document.getElementById('studentChoiceEditModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'studentChoiceEditModal') {
        window.closeStudentChoiceEditModal();
      }
    });

    function renderStep1() { runCrossCheckAnalysis();
      const sem = AppState.currentSemester;
      updateStep1SemesterTabs(sem);
      const subjects = sem === 1 ? AppState.sem1Subjects : AppState.sem2Subjects;
      const threshold = AppState.step1Threshold;

      matrixTableTitle.textContent = `${AppState.detectedGrade} [${sem}학기] 학생별 선택과목 매트릭스 현황`;

      // Calculate subject counts
      const counts = {};
      const normMap = {};
      subjects.forEach(s => {
        counts[s] = 0;
        normMap[normalizeSubject(s)] = s;
      });
      AppState.students.forEach(st => {
        const selected = sem === 1 ? (st.sem1 || []) : (st.sem2 || []);
        selected.forEach(s => {
          const canonical = normMap[normalizeSubject(s)] || s;
          if (counts[canonical] !== undefined) counts[canonical]++;
        });
      });

      // Update Summary Cards
      statTotalStudents.textContent = `${AppState.students.length}명`;
      statSubjectCount.textContent = `${subjects.length}개`;
      statElectiveCount.textContent = `${sem === 1 ? AppState.sem1GroupCount : AppState.sem2GroupCount}과목`;

      let underThresholdCount = 0;
      subjects.forEach(s => {
        if (counts[s] <= threshold) underThresholdCount++;
      });
      statUnderThresholdCount.textContent = `${underThresholdCount}개`;

      // Update Target Subject Filter Dropdown options
      const subjFilterSel = document.getElementById('step1TargetSubjectFilter');
      if (subjFilterSel) {
        const curVal = step1TableSortState.subjectFilter;
        let optHtml = '<option value="all">전체 과목 (모든 학생)</option>';
        optHtml += `<option value="__modified__" ${curVal === '__modified__' ? 'selected' : ''}>✏️ 선택 수정된 학생만</option>`;
        subjects.forEach(s => {
          const c = counts[s] || 0;
          optHtml += `<option value="${s.replace(/"/g, '&quot;')}" ${curVal === s ? 'selected' : ''}>[${s}] 선택 학생 (${c}명)</option>`;
        });
        subjFilterSel.innerHTML = optHtml;
      }

      renderStep1TableOnly();
      renderSubjectSummaryTable();
    }

    function renderStep1TableOnly() {
      const sem = AppState.currentSemester;
      const baseSubjects = sem === 1 ? (AppState.sem1Subjects || []) : (AppState.sem2Subjects || []);
      const threshold = AppState.step1Threshold;
      const searchQuery = (studentSearchInput.value || '').trim().toLowerCase();

      // Calculate subject counts
      const counts = {};
      const normMap = {};
      baseSubjects.forEach(s => {
        counts[s] = 0;
        normMap[normalizeSubject(s)] = s;
      });
      AppState.students.forEach(st => {
        const selected = sem === 1 ? (st.sem1 || []) : (st.sem2 || []);
        selected.forEach(s => {
          const canonical = normMap[normalizeSubject(s)] || s;
          if (counts[canonical] !== undefined) counts[canonical]++;
        });
      });

      const subjects = getFilteredAndSortedStep1Subjects(sem, counts);

      // 1. Filter students by search and by step1TableSortState.subjectFilter
      const filteredStudents = AppState.students.filter(st => {
        const selected = sem === 1 ? (st.sem1 || []) : (st.sem2 || []);
        if (step1TableSortState.subjectFilter === '__modified__') {
          if (!isStudentChoicesModified(st, sem)) return false;
        } else if (step1TableSortState.subjectFilter !== 'all') {
          const filterNorm = normalizeSubject(step1TableSortState.subjectFilter);
          if (!selected.some(s => normalizeSubject(s) === filterNorm)) return false;
        }
        if (!searchQuery) return true;
        return st.name.toLowerCase().includes(searchQuery) ||
               String(st.classNum).includes(searchQuery) ||
               String(st.studentNum).includes(searchQuery) ||
               (st.career || '').toLowerCase().includes(searchQuery);
      });

      // 2. Sort students according to step1TableSortState
      filteredStudents.sort((a, b) => {
        const cA = parseInt(String(a.classNum).replace(/[^0-9]/g, ''), 10) || 0;
        const cB = parseInt(String(b.classNum).replace(/[^0-9]/g, ''), 10) || 0;
        const nA = parseInt(String(a.studentNum).replace(/[^0-9]/g, ''), 10) || 0;
        const nB = parseInt(String(b.studentNum).replace(/[^0-9]/g, ''), 10) || 0;
        const fallback = (cA !== cB) ? (cA - cB) : (nA - nB);

        const col = step1TableSortState.sortCol;
        const dir = step1TableSortState.sortDir;

        if (col === 'default') return fallback;

        if (col === 'classNum') {
          return dir === 'asc' ? (cA - cB || nA - nB) : (cB - cA || nB - nA);
        }
        if (col === 'studentNum') {
          return dir === 'asc' ? (nA - nB || cA - cB) : (nB - nA || cB - cA);
        }
        if (col === 'name') {
          return dir === 'asc' ? (a.name.localeCompare(b.name, 'ko') || fallback) : (b.name.localeCompare(a.name, 'ko') || fallback);
        }
        if (col === 'career') {
          return dir === 'asc' ? ((a.career || '').localeCompare(b.career || '', 'ko') || fallback) : ((b.career || '').localeCompare(a.career || '', 'ko') || fallback);
        }

        // Subject Column Click:
        // dir === 'asc': 선택자 우선 정렬 (Chosen first)
        // dir === 'desc': 미선택자 우선 정렬 (Unchosen first)
        const normCol = normalizeSubject(col);
        const aChosen = (sem === 1 ? (a.sem1 || []) : (a.sem2 || [])).some(s => normalizeSubject(s) === normCol);
        const bChosen = (sem === 1 ? (b.sem1 || []) : (b.sem2 || [])).some(s => normalizeSubject(s) === normCol);

        if (aChosen !== bChosen) {
          return dir === 'asc' ? (aChosen ? -1 : 1) : (aChosen ? 1 : -1);
        }
        return fallback;
      });

      // Update Toolbar Sort/Filter Badge and Reset Button
      const badge = document.getElementById('step1TableSortBadge');
      const resetBtn = document.getElementById('btnResetStep1TableSort');
      const isSortedOrFiltered = (step1TableSortState.sortCol !== 'default') || 
                                 (step1TableSortState.subjectFilter !== 'all');
      if (badge) {
        if (step1TableSortState.subjectFilter === '__modified__') {
          badge.textContent = `필터: 선택 수정된 학생 (${filteredStudents.length}명)`;
          badge.classList.remove('hidden');
        } else if (step1TableSortState.subjectFilter !== 'all') {
          badge.textContent = `필터: [${step1TableSortState.subjectFilter}] 선택 학생 (${filteredStudents.length}명)`;
          badge.classList.remove('hidden');
        } else if (step1TableSortState.sortCol !== 'default') {
          let colName = step1TableSortState.sortCol;
          if (colName === 'classNum') colName = '반';
          else if (colName === 'studentNum') colName = '번호';
          else if (colName === 'name') colName = '이름';
          else if (colName === 'career') colName = '진로';
          const dirText = step1TableSortState.sortDir === 'asc' ? '선택자/오름차순 ▲' : '미선택자/내림차순 ▼';
          badge.textContent = `정렬: [${colName}] (${dirText})`;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
      if (resetBtn) {
        if (isSortedOrFiltered) {
          resetBtn.classList.remove('hidden');
        } else {
          resetBtn.classList.add('hidden');
        }
      }

      // Update Toolbar Modified Students Badge and Revert All Button
      const modBadge = document.getElementById('step1ModifiedBadge');
      const modRevertBtn = document.getElementById('btnRevertAllStep1');
      const totalModifiedCount = (AppState.students || []).filter(st => isStudentChoicesModified(st, sem)).length;
      if (modBadge) {
        if (totalModifiedCount > 0) {
          modBadge.textContent = `✏️ 선택 수정: ${totalModifiedCount}명`;
          modBadge.classList.remove('hidden');
        } else {
          modBadge.classList.add('hidden');
        }
      }
      if (modRevertBtn) {
        if (totalModifiedCount > 0) {
          modRevertBtn.classList.remove('hidden');
        } else {
          modRevertBtn.classList.add('hidden');
        }
      }

      if (subjects.length === 0) {
        matrixTable.innerHTML = `
          <thead><tr class="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
            <th class="p-8 text-center text-slate-500 text-sm">선택된 필터 조건에 해당하는 과목이 없습니다.</th>
          </tr></thead>
        `;
        return;
      }

      const getStep1SortIcon = (key) => {
        if (step1TableSortState.sortCol === key) {
          return step1TableSortState.sortDir === 'asc' 
            ? ' <span class="text-blue-600 font-black">▲</span>' 
            : ' <span class="text-indigo-600 font-black">▼</span>';
        }
        return ' <span class="text-slate-400 font-normal text-[10px]">⇅</span>';
      };

      // Build Table HTML
      let html = '<thead><tr class="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 sticky top-0 z-20">';
      html += `<th onclick="window.handleStep1ColHeaderClick('classNum')" class="p-2.5 text-center border-r border-slate-200 w-12 bg-slate-100 cursor-pointer hover:bg-slate-200 select-none transition-colors" title="클릭하여 반 순서 정렬">반${getStep1SortIcon('classNum')}</th>`;
      html += `<th onclick="window.handleStep1ColHeaderClick('studentNum')" class="p-2.5 text-center border-r border-slate-200 w-12 bg-slate-100 cursor-pointer hover:bg-slate-200 select-none transition-colors" title="클릭하여 번호 순서 정렬">번호${getStep1SortIcon('studentNum')}</th>`;
      html += `<th onclick="window.handleStep1ColHeaderClick('name')" class="p-2.5 text-left border-r border-slate-200 w-28 bg-slate-100 cursor-pointer hover:bg-slate-200 select-none transition-colors" title="클릭하여 이름 순서 정렬">이름${getStep1SortIcon('name')}</th>`;
      html += `<th onclick="window.handleStep1ColHeaderClick('career')" class="p-2.5 text-left border-r border-slate-200 w-28 bg-slate-100 cursor-pointer hover:bg-slate-200 select-none transition-colors" title="클릭하여 진로 순서 정렬">진로·관심학과${getStep1SortIcon('career')}</th>`;

      subjects.forEach(s => {
        const isUnder = counts[s] <= threshold;
        const isTargetFilter = step1TableSortState.subjectFilter === s;
        const isColSorted = step1TableSortState.sortCol === s;
        
        let colStyle = '';
        if (isTargetFilter) {
          colStyle = 'style="background-color: #dbeafe; color: #1e3a8a; border-left: 2px solid #3b82f6; border-right: 2px solid #3b82f6;"';
        } else if (isColSorted) {
          colStyle = 'style="background-color: #e0e7ff; color: #3730a3;"';
        } else if (isUnder) {
          colStyle = 'style="background-color: #cbd5e1; color: #334155;"';
        }

        let sortBadge = '<span class="text-slate-400 font-normal text-[10px] ml-0.5 opacity-60 group-hover:opacity-100">⇅</span>';
        if (isColSorted) {
          if (step1TableSortState.sortDir === 'asc') {
            sortBadge = '<span class="ml-1 px-1.5 py-0.2 rounded bg-blue-600 text-white font-extrabold text-[10px] shadow-2xs">▲선택자</span>';
          } else {
            sortBadge = '<span class="ml-1 px-1.5 py-0.2 rounded bg-indigo-600 text-white font-extrabold text-[10px] shadow-2xs">▼미선택자</span>';
          }
        }

        const safeS = s.replace(/'/g, "\\'");
        html += `<th onclick="window.handleStep1SubjectColClick('${safeS}')" class="p-2.5 text-center border-r border-slate-200 whitespace-nowrap min-w-[75px] cursor-pointer hover:bg-blue-100/70 select-none transition-colors group" ${colStyle} title="클릭하여 [${s}] 선택자 우선(오름차순)/미선택자 우선(내림차순) 정렬">
          <div class="font-bold flex items-center justify-center">${s}</div>
          <div class="text-[11px] font-normal mt-0.5 opacity-90 flex items-center justify-center">${counts[s]}명 ${sortBadge}</div>
        </th>`;
      });
      html += '</tr></thead>';

      // Table Body
      html += '<tbody class="divide-y divide-slate-200 text-slate-700">';
      filteredStudents.forEach((st, idx) => {
        const origList = getStudentOriginalChoices(st, sem);
        const activeList = getStudentActiveChoices(st, sem);
        const isModified = isStudentChoicesModified(st, sem);
        const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';

        // Check if this student has duplicate enrollments from prior data
        const dupSt = (AppState.crossCheckResult && AppState.crossCheckResult.duplicateEnrollments)
          ? AppState.crossCheckResult.duplicateEnrollments.find(d => 
              String(d.classNum).replace(/[^0-9]/g, '') === String(st.classNum).replace(/[^0-9]/g, '') &&
              d.name.trim() === st.name.trim()
            )
          : null;
        const dupSubjNorms = new Set(
          dupSt ? dupSt.dupList.filter(d => d.semester === sem).map(d => d.normalized) : []
        );

        html += `<tr class="${rowBg} hover:bg-blue-50/60 transition-colors">`;
        html += `<td class="p-2 text-center border-r border-slate-200 font-medium">${st.classNum}</td>`;
        html += `<td class="p-2 text-center border-r border-slate-200 font-medium">${st.studentNum}</td>`;
        html += `<td class="p-2 border-r border-slate-200">
          <div class="flex items-center justify-between gap-1">
            <span class="font-bold text-slate-900">${st.name}</span>
            <div class="flex items-center gap-0.5 shrink-0">
              ${isModified ? `
                <span class="px-1 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-extrabold border border-amber-300 shadow-2xs" title="선택 과목이 수정됨">수정</span>
                <button type="button" onclick="event.stopPropagation(); window.revertStudentChoices('${st.id}', ${sem});" class="text-blue-600 hover:text-blue-800 text-[10px] underline font-semibold cursor-pointer" title="이 학생 원래 선택으로 복원">↩</button>
              ` : ''}
              ${st.isNewlyAdded ? `<span class="px-1 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-800 font-extrabold border border-indigo-300 shadow-2xs" title="추가된 학생">추가</span>` : ''}
              <button type="button" onclick="event.stopPropagation(); window.openStudentChoiceEditModal('${st.id}', ${sem});" class="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition text-[11px] cursor-pointer" title="과목 일괄 편집 창 열기">✏️</button>
              ${st.isNewlyAdded ? `<button type="button" onclick="event.stopPropagation(); window.deleteAddedStudent('${st.id}');" class="p-0.5 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition text-[11px] cursor-pointer" title="추가한 학생 삭제">🗑️</button>` : ''}
            </div>
          </div>
        </td>`;
        html += `<td class="p-2 text-slate-500 border-r border-slate-200 text-[11px] truncate max-w-[120px]" title="${st.career || ''}">${st.career || ''}</td>`;

        subjects.forEach(s => {
          const normS = normalizeSubject(s);
          const wasOriginallySelected = origList.some(orig => normalizeSubject(orig) === normS);
          const isCurrentlySelected = activeList.some(act => normalizeSubject(act) === normS);
          const isUnder = counts[s] <= threshold;
          const isDup = dupSubjNorms.has(normS);

          let cellContent = '';
          let cellBg = isUnder ? 'style="background-color: #cbd5e1;"' : '';
          let cellTitle = '';

          if (wasOriginallySelected && isCurrentlySelected) {
            if (isDup) {
              const dupItem = dupSt ? dupSt.dupList.find(d => d.semester === sem && d.normalized === normalizeSubject(s)) : null;
              const dupTip = dupItem ? `${dupItem.sourceLabel} 주의` : '중복 신청 주의';
              cellContent = `<span class="inline-block px-1.5 py-0.5 rounded font-bold text-[11px] bg-amber-100 text-amber-900 border border-amber-400 hover:opacity-80 transition select-none" title="${dupTip} (클릭 시 선택 취소)">선택(중복)</span>`;
            } else {
              cellContent = `<span class="inline-block px-1.5 py-0.5 rounded font-bold text-[11px] bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition select-none shadow-2xs" title="원래 선택한 과목 (클릭 시 선택 취소/제외)">선택</span>`;
            }
            cellTitle = `[${s}] 원래 선택한 과목 - 클릭 시 선택 취소`;
          } else if (wasOriginallySelected && !isCurrentlySelected) {
            cellBg = 'style="background-color: #ffe4e6;"';
            cellContent = `<span class="inline-block px-1.5 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-700 border border-rose-300 line-through decoration-rose-600 decoration-2 hover:bg-rose-200 transition select-none shadow-2xs" title="원래 선택했으나 취소됨 (집계 제외) - 클릭 시 원본 복원">✕ 취소됨</span>`;
            cellTitle = `[${s}] 원래 선택했으나 취소됨 (집계 제외) - 클릭 시 원본 복원`;
          } else if (!wasOriginallySelected && isCurrentlySelected) {
            if (isDup) {
              const dupItems = dupSt ? dupSt.dupList.filter(d => d.semester === sem && d.normalized === normS) : [];
              const dupTip = dupItems.length > 0 ? Array.from(new Set(dupItems.map(d => d.sourceLabel))).join(', ') + ' 주의' : '중복 신청 주의';
              cellBg = 'style="background-color: #fef3c7;"';
              cellContent = `<span class="inline-block px-1.5 py-0.5 rounded font-extrabold text-[11px] bg-amber-100 text-amber-900 border border-amber-400 hover:bg-amber-200 transition select-none shadow-2xs" title="⚠️ ${dupTip} - 새로 추가/수정된 과목 (클릭 시 취소)">수정(중복)</span>`;
              cellTitle = `⚠️ [${s}] ${dupTip} - 새로 추가/수정된 과목 (클릭 시 취소)`;
            } else {
              cellBg = 'style="background-color: #d1fae5;"';
              cellContent = `<span class="inline-block px-1.5 py-0.5 rounded font-extrabold text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-400 hover:bg-emerald-200 transition select-none shadow-2xs" title="새로 추가/수정된 과목 (집계 포함) - 클릭 시 취소">수정</span>`;
              cellTitle = `[${s}] 새로 추가/수정된 과목 (집계 포함) - 클릭 시 취소`;
            }
          } else {
            cellContent = `<span class="text-slate-300 group-hover:text-blue-500 font-bold text-xs select-none transition-colors" title="클릭 시 [${s}] 추가">-</span>`;
            cellTitle = `클릭 시 [${s}] 추가`;
          }

          const safeS = s.replace(/'/g, "\\'");
          html += `<td class="p-1.5 text-center border-r border-slate-200 cursor-pointer group hover:ring-2 hover:ring-blue-400 hover:ring-inset transition-all" ${cellBg} onclick="window.toggleStudentSubjectSelection('${st.id}', '${safeS}', ${sem});" title="${cellTitle}">
            ${cellContent}
          </td>`;
        });
        html += '</tr>';
      });
      html += '</tbody>';

      // Table Footer (Sum Totals)
      html += '<tfoot><tr class="bg-slate-200/80 font-black text-slate-900 border-t-2 border-slate-300 sticky bottom-0 z-20">';
      html += '<td colspan="4" class="p-2.5 text-center border-r border-slate-300 font-bold bg-slate-200">신청 인원 합계</td>';
      subjects.forEach(s => {
        const isUnder = counts[s] <= threshold;
        const colStyle = isUnder ? 'style="background-color: #94a3b8; color: #ffffff;"' : '';
        html += `<td class="p-2.5 text-center border-r border-slate-300 font-black text-sm" ${colStyle}>
          ${counts[s]}명
          ${isUnder ? '<span class="block text-[10px] font-normal">(기준 이하)</span>' : ''}
        </td>`;
      });
      html += '</tr></tfoot>';

      matrixTable.innerHTML = html;
    }

    // 이전 기준 날짜 1단계의 폐강 확정 과목을 현재 기준 날짜 1단계로 1회성 복사 (불러오기만 하고 이전 날짜 데이터와 연결하지 않음)
    function importPrevDateClosedSubjectsOnce(targetState, targetDate, targetGrade) {
      if (!targetState || !targetDate || !targetGrade || targetGrade === '전체') return false;
      const currAY = MultiState.activeAcademicYear || '2027학년도';
      const dateList = (MultiState.datesByAcademicYear && MultiState.datesByAcademicYear[currAY]) || MultiState.yearsList || [];
      const curIdx = dateList.indexOf(targetDate);
      if (curIdx <= 0) return false;

      const curAcadData = getAcadData(currAY);
      let prevGData = null;
      for (let i = curIdx - 1; i >= 0; i--) {
        const dStr = dateList[i];
        const candidate = curAcadData[dStr]?.[targetGrade];
        if (!candidate) continue;
        const c1 = candidate.closedSubjects?.[1] || [];
        const c2 = candidate.closedSubjects?.[2] || [];
        const hasStudents = Array.isArray(candidate.students) && candidate.students.length > 0;
        if (c1.length > 0 || c2.length > 0 || hasStudents) {
          prevGData = candidate;
          break;
        }
      }
      if (!prevGData) return false;

      const prevClosed1 = Array.isArray(prevGData.closedSubjects?.[1]) ? [...prevGData.closedSubjects[1]] : [];
      const prevClosed2 = Array.isArray(prevGData.closedSubjects?.[2]) ? [...prevGData.closedSubjects[2]] : [];
      if (prevClosed1.length === 0 && prevClosed2.length === 0) return false;

      targetState.sem1Subjects = Array.isArray(targetState.sem1Subjects) ? [...targetState.sem1Subjects] : [];
      targetState.sem2Subjects = Array.isArray(targetState.sem2Subjects) ? [...targetState.sem2Subjects] : [];
      targetState.closedSubjects = {
        1: Array.isArray(targetState.closedSubjects?.[1]) ? [...targetState.closedSubjects[1]] : [],
        2: Array.isArray(targetState.closedSubjects?.[2]) ? [...targetState.closedSubjects[2]] : []
      };

      [
        { sem: 1, prevList: prevClosed1, subjList: targetState.sem1Subjects },
        { sem: 2, prevList: prevClosed2, subjList: targetState.sem2Subjects }
      ].forEach(({ sem, prevList, subjList }) => {
        let addedSubj = false;
        prevList.forEach(rawName => {
          const cleanName = String(rawName || '').trim();
          if (!cleanName) return;
          const norm = normalizeSubject(cleanName);
          let canonical = subjList.find(s => normalizeSubject(s) === norm);
          if (!canonical) {
            subjList.push(cleanName);
            canonical = cleanName;
            addedSubj = true;
          }
          if (!targetState.closedSubjects[sem].some(c => normalizeSubject(c) === norm)) {
            targetState.closedSubjects[sem].push(canonical);
          }
        });
        if (addedSubj) {
          subjList.sort((a, b) => a.localeCompare(b, 'ko'));
        }
      });

      targetState._closedImportedFromPrev = true;
      return true;
    }
    window.importPrevDateClosedSubjectsOnce = importPrevDateClosedSubjectsOnce;

    // Toggle Subject Closed (폐강 확정 / 해제 - 현재 탭 고유 상태 관리, 이전 날짜와 완전히 독립)
    window.toggleSubjectClosed = function(subjectName) {
      const sem = AppState.currentSemester;
      if (!AppState.closedSubjects) AppState.closedSubjects = { 1: [], 2: [] };
      if (!AppState.closedSubjects[sem]) AppState.closedSubjects[sem] = [];
      AppState._closedImportedFromPrev = true;

      const normTarget = normalizeSubject(subjectName);
      const idx = AppState.closedSubjects[sem].findIndex(s => normalizeSubject(s) === normTarget);
      if (idx >= 0) {
        AppState.closedSubjects[sem].splice(idx, 1);
      } else {
        AppState.closedSubjects[sem].push(subjectName);
        if (AppState.splitSubjects?.[sem]?.[subjectName]) {
          delete AppState.splitSubjects[sem][subjectName];
        }
        if (AppState.pinnedSubjects?.[sem]?.[subjectName]) {
          delete AppState.pinnedSubjects[sem][subjectName];
        }
      }

      renderSubjectSummaryTable();
      initStep2Controls();
      runOptimization();
      renderStep2Results();
      renderSavedPlansList();
      saveAllState();
    };

    // Update Subject Retention Memo (폐강 보류 및 비고 메모)
    window.updateSubjectMemo = function(subjectName, memo) {
      const sem = AppState.currentSemester;
      if (!AppState.subjectMemos) AppState.subjectMemos = { 1: {}, 2: {} };
      if (!AppState.subjectMemos[sem]) AppState.subjectMemos[sem] = {};

      const trimmed = (memo || '').trim();
      if (trimmed) {
        AppState.subjectMemos[sem][subjectName] = trimmed;
      } else {
        delete AppState.subjectMemos[sem][subjectName];
      }
      saveAllState();
    };

    // 이전 기준 날짜들의 폐강 과목 이력 조회 헬퍼 함수
    function getPreviousDatesClosedSubjectsHistory(sem) {
      const acadData = getAcadData();
      const curGrade = MultiState.activeGrade || AppState.detectedGrade || '2학년';
      const curDate = MultiState.activeYear;

      const historyByDate = {}; // { '2027.10.11.': [ { subject: '육상', count: 2, date: '2027.10.11.', students: ['1반 3번 홍길동', ...] } ] }
      const allPrevClosedSet = new Set();
      const prevClosedInfoMap = {}; // subjName -> { subject, count, date, students }

      (MultiState.yearsList || []).forEach(dateStr => {
        if (dateStr === curDate) return;
        const gData = acadData[dateStr]?.[curGrade];
        if (!gData) return;

        const closedList = gData.closedSubjects?.[sem] || [];
        if (closedList.length === 0) return;

        const dateItems = [];
        closedList.forEach(sName => {
          if (!sName) return;
          let c = 0;
          const studentList = [];
          (gData.students || []).forEach(st => {
            const list = (sem === 1 ? st.sem1 : st.sem2) || [];
            if (list.includes(sName)) {
              c++;
              const labelParts = [];
              if (st.classNum) labelParts.push(`${st.classNum}반`);
              if (st.studentNum) labelParts.push(`${st.studentNum}번`);
              labelParts.push(st.name || '학생');
              studentList.push(labelParts.join(' '));
            }
          });

          const itemObj = { subject: sName, count: c, date: dateStr, students: studentList };
          dateItems.push(itemObj);
          allPrevClosedSet.add(sName);
          if (!prevClosedInfoMap[sName]) {
            prevClosedInfoMap[sName] = itemObj;
          }
        });

        if (dateItems.length > 0) {
          historyByDate[dateStr] = dateItems;
        }
      });

      return {
        historyByDate,
        allPrevClosedSet,
        prevClosedInfoMap
      };
    }
    window.getPreviousDatesClosedSubjectsHistory = getPreviousDatesClosedSubjectsHistory;

    // 수강신청 조사 엑셀 양식 및 작성 가이드 다운로드 함수
    window.downloadSurveyExcelTemplate = function() {
      if (typeof XLSX === 'undefined') {
        alert('엑셀 라이브러리가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      const wb = XLSX.utils.book_new();

      // Sheet 1: 수강신청_조사_양식
      const sampleRows = [
        ['타임스탬프', '학번', '성명', '1학기 선택과목1', '1학기 선택과목2', '1학기 선택과목3', '2학기 선택과목1', '2학기 선택과목2', '2학기 선택과목3'],
        ['2026. 10. 15. 오전 9:10:00', 2101, '김민준', '물리학Ⅰ', '화학Ⅰ', '세계지리', '물리학Ⅱ', '화학Ⅱ', '여행지리'],
        ['2026. 10. 15. 오전 9:12:30', 2102, '이서연', '생명과학Ⅰ', '지구과학Ⅰ', '사회·문화', '생명과학Ⅱ', '지구과학Ⅱ', '생활과 윤리'],
        ['2026. 10. 15. 오전 9:15:10', 2201, '박도윤', '세계사', '경제', '정치와 법', '동아시아사', '현대사회와 철학', '인간과 심리'],
        ['2026. 10. 15. 오전 9:18:45', 2202, '최예은', '화학Ⅰ', '생명과학Ⅰ', '사회·문화', '화학Ⅱ', '생명과학Ⅱ', '윤리와 사상']
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(sampleRows);
      ws1['!cols'] = [
        { wch: 25 }, { wch: 10 }, { wch: 12 },
        { wch: 18 }, { wch: 18 }, { wch: 18 },
        { wch: 18 }, { wch: 18 }, { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, ws1, '수강신청_조사_양식');

      // Sheet 2: 작성_가이드_및_인식기준
      const guideRows = [
        ['수강신청 조사 엑셀 파일 작성 가이드 및 시스템 인식 기준'],
        [''],
        ['1. 권장 서식 및 기본 원칙'],
        ['  - 1행은 반드시 열 헤더(타임스탬프, 학번, 성명, 1학기 선택과목 등)여야 합니다.'],
        ['  - 구글 설문지, 네이버 폼, 리로스쿨 등에서 내려받은 엑셀(.xlsx) 원본을 그대로 업로드하셔도 대부분 자동 인식됩니다.'],
        ['  - 학번은 4자리(예: 2101 -> 2학년 1반 1번) 또는 반, 번호 개별 열 모두 지원합니다.'],
        [''],
        ['2. 열(헤더) 자동 인식 키워드'],
        ['  - 학번: [학번], [학생번호], [번호], [ID], [코드]'],
        ['  - 성명: [이름], [성명], [학생명], [학생 성명]'],
        ['  - 반 / 번호(개별 열일 경우): [반], [학급] / [번호], [출석번호]'],
        ['  - 과목 열: [1학기], [2학기], [선택], [과목], [지망], [희망], [과목명]'],
        [''],
        ['3. 과목명 띄어쓰기 및 기호 자동 정규화 인식 기준'],
        ['  - 띄어쓰기 무시: [세계 지리]와 [세계지리], [생활과 윤리]와 [생활과윤리] 등 공백 유무에 관계없이 100% 동일 과목으로 인식합니다.'],
        ['  - 로마자 및 숫자 변환: [물리학Ⅰ], [물리학I], [물리학1] 등 로마숫자(Ⅰ,Ⅱ), 알파벳(I,II), 아라비아 숫자(1,2)를 상호 호환하여 인식합니다.'],
        ['  - 특수기호 유연 처리: 가운뎃점(·), 슬래시(/), 쉼표(,), 하이픈(-), 밑줄(_) 등이 포함되어도 핵심 과목명을 찾아냅니다. (예: 사회·문화 = 사회문화)'],
        ['  - 괄호 및 교과 코드 제거: [물리학Ⅰ(3단위)], [[선택] 화학Ⅰ] 등 접두/접미어나 단위수 표기는 자동으로 순수 과목명으로 정제됩니다.'],
        [''],
        ['4. 전체 수강 과목 (체육 및 학교지정 공통과목 안내)'],
        ['  - 스포츠 문화, 스포츠 과학, 학교지정 공통 과목 등 학년 전체 학생이 이수하는 과목은 학생 선택 설문지에 없어도 무방합니다.'],
        ['  - 시스템 1단계의 [사전 등록 데이터(NEIS 학생 명부)]를 기준으로 1반, 2반 전체 학생 인원 및 수강자 명단이 자동으로 배정·정리됩니다.'],
        [''],
        ['5. 비고 및 팁'],
        ['  - 과목명이 교육과정 편제표와 크게 상이한 경우 편제표 기준 과목명으로 작성해주시면 더욱 정확하게 분석됩니다.']
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(guideRows);
      ws2['!cols'] = [{ wch: 110 }];
      XLSX.utils.book_append_sheet(wb, ws2, '작성_가이드_및_인식기준');

      const curGrade = MultiState.activeGrade || AppState.detectedGrade || '2학년';
      const acadYear = MultiState.activeAcademicYear || '2027학년도';
      const fileName = `${acadYear}_${curGrade}_수강신청_조사_양식_및_가이드.xlsx`;
      XLSX.writeFile(wb, fileName);
    };


    // Render Subject Summary & Retention Table (과목별 수강 인원 및 개설·폐강 현황)
    function renderSubjectSummaryTable() {
      const sem = AppState.currentSemester;
      const allSubjects = sem === 1 ? (AppState.sem1Subjects || []) : (AppState.sem2Subjects || []);
      const threshold = AppState.step1Threshold;

      const acadYearStr = MultiState.activeAcademicYear || '2027학년도';
      const titleEl = document.getElementById('subjectSummaryTitle');
      if (titleEl) {
        titleEl.textContent = `${acadYearStr} ${AppState.detectedGrade} [${sem}학기] 과목별 수강 인원 및 개설·폐강 현황`;
      }

      // 이전 기준 날짜와 실시간 연결하지 않도록 참고 배너 비활성화 (가져온 폐강 과목은 현재 탭 자체 표에 독립 반영됨)
      const noticeContainer = document.getElementById('subjectSummaryHistoryClosedNotice');
      if (noticeContainer) {
        noticeContainer.classList.add('hidden');
        noticeContainer.innerHTML = '';
      }

      // 현재 학기 closedSubjects 초기화 (현재 탭의 독립적인 폐강 설정 보존)
      if (!AppState.closedSubjects) AppState.closedSubjects = { 1: [], 2: [] };
      if (!AppState.closedSubjects[sem]) AppState.closedSubjects[sem] = [];

      const closedList = AppState.closedSubjects?.[sem] || [];
      const memoMap = AppState.subjectMemos?.[sem] || {};

      // Compute counts per subject
      const counts = {};
      const normMap = {};
      allSubjects.forEach(s => {
        counts[s] = 0;
        normMap[normalizeSubject(s)] = s;
      });
      AppState.students.forEach(st => {
        const selected = sem === 1 ? (st.sem1 || []) : (st.sem2 || []);
        selected.forEach(s => {
          const canonical = normMap[normalizeSubject(s)] || s;
          if (counts[canonical] !== undefined) counts[canonical]++;
        });
      });

      // Filter & Sort subjects
      const displayedSubjects = getFilteredAndSortedStep1Subjects(sem, counts);

      let totalCount = 0;
      let underCount = 0;
      let closedCount = 0;

      const closedNorms = new Set(closedList.map(s => normalizeSubject(s)));
      allSubjects.forEach(subj => {
        const c = counts[subj] || 0;
        totalCount += c;
        if (closedNorms.has(normalizeSubject(subj))) closedCount++;
        else if (c <= threshold) underCount++;
      });

      const sortMode = document.getElementById('step1SubjectSortSelect')?.value || 'default';
      const nameSortIcon = sortMode === 'name_asc' ? '▲ (ㄱ→ㅎ)' : (sortMode === 'name_desc' ? '▼ (ㅎ→ㄱ)' : '↕️');
      const countSortIcon = sortMode === 'count_desc' ? '▼ (많은순)' : (sortMode === 'count_asc' ? '▲ (적은순)' : '↕️');

      const subjectData = displayedSubjects.map((subj, idx) => {
        const count = counts[subj] || 0;
        const normSubj = normalizeSubject(subj);
        const isClosed = closedList.some(c => normalizeSubject(c) === normSubj);
        const isUnder = count <= threshold;
        const memoStr = memoMap[subj] || '';
        const isNewlyAdded = subj.includes('(신설)') || memoStr.includes('과목 신설') || memoStr.includes('신설');

        return {
          index: idx + 1,
          name: subj,
          count: count,
          isUnder: isUnder,
          isClosed: isClosed,
          isNewlyAdded: isNewlyAdded,
          memo: memoStr,
          isFromHistory: false
        };
      });

      // Build Table HTML
      let html = `<thead>
        <tr class="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 sticky top-0 z-10 text-xs">
          <th class="p-2.5 text-center border-r border-slate-300 w-12 bg-slate-100">연번</th>
          <th class="p-2.5 text-left border-r border-slate-300 w-48 bg-slate-100 cursor-pointer hover:bg-slate-200 select-none transition-colors group" onclick="window.cycleStep1SubjectSort('name')" title="클릭하여 과목명 오름차순/내림차순 정렬">
            <div class="flex items-center justify-between">
              <span>과목명</span>
              <span class="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 group-hover:bg-blue-100">${nameSortIcon}</span>
            </div>
          </th>
          <th class="p-2.5 text-center border-r border-slate-300 w-36 bg-slate-100 cursor-pointer hover:bg-slate-200 select-none transition-colors group" onclick="window.cycleStep1SubjectSort('count')" title="클릭하여 신청 인원 많은순(내림차순)/적은순(오름차순) 정렬">
            <div class="flex items-center justify-center gap-1.5">
              <span>수강 신청 인원</span>
              <span class="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 group-hover:bg-blue-100">${countSortIcon}</span>
            </div>
          </th>
          <th class="p-2.5 text-center border-r border-slate-300 w-28 bg-slate-100">개설 상태</th>
          <th class="p-2.5 text-center border-r border-slate-300 w-24 bg-slate-100">폐강 확정</th>
          <th class="p-2.5 text-left w-64 bg-slate-100">폐강 보류 및 비고 메모</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 text-xs text-slate-700">`;

      if (subjectData.length === 0) {
        html += `<tr><td colspan="6" class="p-8 text-center text-slate-400 font-medium">선택된 필터 조건에 해당하는 과목이 없습니다.</td></tr>`;
      } else {
        subjectData.forEach((item, idx) => {
          const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';
          let rowStyle = '';
          if (item.isClosed) {
            rowStyle = 'style="background-color: #fee2e2;"';
          } else if (item.isNewlyAdded) {
            rowStyle = 'style="background-color: #f0fdfa;"';
          } else if (item.isUnder) {
            rowStyle = 'style="background-color: #fef2f2;"';
          }
          
          // Count badge
          const countBadge = item.isUnder
            ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">${item.count}명</span>`
            : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">${item.count}명</span>`;

          // Status badge
          let statusBadge = '';
          if (item.isClosed) {
            statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-700 text-white shadow-xs">[폐강 확정]</span>`;
          } else if (item.isNewlyAdded) {
            statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-300 shadow-3xs">신설 개설</span>`;
          } else if (item.isUnder) {
            statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">[폐강 예정]</span>`;
          } else {
            statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">개설</span>`;
          }

          // Closed Checkbox
          const safeItemName = String(item.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
          const closedCheckboxHtml = `
            <label class="inline-flex items-center justify-center cursor-pointer p-1 rounded-md transition-colors ${item.isClosed ? 'bg-rose-200/90 border border-rose-400 text-rose-950 font-extrabold shadow-2xs' : 'hover:bg-slate-100 border border-slate-200'}" title="${item.isClosed ? '폐강 확정 해제 (2단계 포함)' : '폐강 확정 (2단계 그룹핑 제외)'}">
              <input type="checkbox" onchange="window.toggleSubjectClosed('${safeItemName}')" ${item.isClosed ? 'checked' : ''} class="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer">
              <span class="ml-1.5 text-xs ${item.isClosed ? 'font-black text-rose-900' : 'text-slate-600 font-medium'}">${item.isClosed ? '확정' : '체크'}</span>
            </label>
          `;

          // Memo input
          const memoHtml = `
            <div class="relative flex items-center">
              <input type="text" 
                     value="${(item.memo || '').replace(/"/g, '&quot;')}" 
                     placeholder="${item.isUnder ? '폐강 보류 요청 사유 등 메모...' : '비고 / 메모 입력...'}" 
                     onchange="window.updateSubjectMemo('${safeItemName}', this.value)" 
                     onblur="window.updateSubjectMemo('${safeItemName}', this.value)" 
                     class="w-full text-xs px-2.5 py-1 rounded-md border ${item.memo ? 'border-amber-300 bg-amber-50/60 text-slate-800 font-medium' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'} focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                     title="폐강 보류 또는 과목 관련 메모를 입력하세요 (자동 저장)">
              ${item.memo ? '<span class="absolute right-2 text-amber-500 text-xs select-none pointer-events-none" title="메모 저장됨">📝</span>' : ''}
            </div>
          `;

          let nameDisplay = '';
          if (item.isFromHistory) {
            nameDisplay = `<span class="line-through text-slate-400 mr-1.5">${escapeHtml(item.name)}</span><span class="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300" title="${escapeHtml(item.historyDate)} 폐강 과목">이전 폐강</span>`;
          } else if (item.isClosed) {
            nameDisplay = `<span class="line-through text-slate-400 mr-1.5">${escapeHtml(item.name)}</span><span class="text-[11px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300">폐강</span>`;
          } else if (item.isNewlyAdded) {
            const cleanSubj = item.name.replace(/\(신설\)/g, '').trim();
            nameDisplay = `<span class="text-slate-900 font-bold">${escapeHtml(cleanSubj)}</span> <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-black bg-teal-100 text-teal-800 border border-teal-300 shadow-3xs">신설</span>`;
          } else {
            nameDisplay = `<span class="text-slate-900">${escapeHtml(item.name)}</span>`;
          }

          html += `<tr class="${rowBg} hover:bg-blue-50/40 transition-colors" ${rowStyle}>
            <td class="p-2.5 text-center font-medium border-r border-slate-200 text-slate-500">${item.index}</td>
            <td class="p-2.5 font-bold border-r border-slate-200 text-sm">${nameDisplay}</td>
            <td class="p-2.5 text-center border-r border-slate-200 font-bold">${countBadge}</td>
            <td class="p-2.5 text-center border-r border-slate-200 font-semibold">${statusBadge}</td>
            <td class="p-2.5 text-center border-r border-slate-200">${closedCheckboxHtml}</td>
            <td class="p-2 text-left">${memoHtml}</td>
          </tr>`;
        });
      }

      html += `</tbody>
      <tfoot>
        <tr class="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300 text-xs">
          <td colspan="2" class="p-2.5 text-center border-r border-slate-300 font-bold">
            과목 수 (표시: ${displayedSubjects.length}개 / 전체: ${allSubjects.length}개)
          </td>
          <td class="p-2.5 text-center border-r border-slate-300 text-blue-700 font-bold">총 ${totalCount}건</td>
          <td class="p-2.5 text-center border-r border-slate-300 text-slate-700 font-bold">[예정] ${underCount}개</td>
          <td class="p-2.5 text-center border-r border-slate-300 text-rose-700 font-bold">[폐강 확정] ${closedCount}개</td>
          <td class="p-2.5 text-left text-slate-500 font-medium pl-3">기준 ${threshold}명 이하 | 확정 시 2단계 자동 제외</td>
        </tr>
      </tfoot>`;

      const summaryTable = document.getElementById('subjectSummaryTable');
      if (summaryTable) summaryTable.innerHTML = html;
    }

    // Export Dedicated Subject Summary & Retention Excel (1학기 & 2학기 한 페이지 통합 출력)
    document.getElementById('btnExportSubjectSummary')?.addEventListener('click', () => {
      exportSubjectSummaryExcel();
    });

    function exportSubjectSummaryExcel() {
      try {
        if (!AppState.students || AppState.students.length === 0) {
          alert('다운로드할 1단계 학생 수강신청 데이터가 없습니다. 먼저 엑셀 파일을 업로드해주세요.');
          return;
        }

        const threshold = AppState.step1Threshold;
        const wb = XLSX.utils.book_new();

      const rows = [];
      const rowHeights = [];
      const merges = [];

      // ================= 1학기 테이블 =================
      const sem1Subjs = AppState.sem1Subjects || [];
      const closed1List = AppState.closedSubjects?.[1] || [];
      const memo1Map = AppState.subjectMemos?.[1] || {};
      const r1Start = rows.length; // 0
      const acadYearStr = MultiState.activeAcademicYear || '2027학년도';
      rows.push([`${acadYearStr} ${AppState.detectedGrade} [1학기] 과목별 수강 인원 및 개설·폐강 현황표`]);
      rows.push([`기준 인원: ${threshold}명 이하 | 전체 과목 수: ${sem1Subjs.length}개 | 출력일시: ${new Date().toLocaleString()}`]);
      rows.push([]);
      rows.push(['연번', '과목명', '수강 신청 인원', '개설 상태', '폐강 확정', '폐강 보류 및 비고 메모']);

      merges.push({ s: { r: r1Start, c: 0 }, e: { r: r1Start, c: 5 } });
      merges.push({ s: { r: r1Start + 1, c: 0 }, e: { r: r1Start + 1, c: 5 } });
      rowHeights.push({ hpt: 30 }, { hpt: 18 }, { hpt: 8 }, { hpt: 24 });

      let under1 = 0;
      let closed1 = 0;
      let total1 = 0;
      const fullSem1Subjs = [...sem1Subjs];

      fullSem1Subjs.forEach((s, idx) => {
        const normS = normalizeSubject(s);
        let count = 0;
        AppState.students.forEach(st => {
          if ((st.sem1 || []).some(sub => normalizeSubject(sub) === normS)) count++;
        });
        total1 += count;
        const isUnder = count <= threshold;
        if (isUnder) under1++;
        const isClosed = closed1List.some(c => normalizeSubject(c) === normS);
        if (isClosed) closed1++;

        const status = isClosed ? '[폐강 확정]' : (isUnder ? '[폐강 예정]' : '개설');
        const closedText = isClosed ? '확정 (제외)' : '';
        const memoText = memo1Map[s] || '';
        rows.push([idx + 1, s, `${count}명`, status, closedText, memoText]);
        rowHeights.push({ hpt: 20 });
      });

      const r1Sum = rows.length;
      rows.push(['합계', `전체 ${sem1Subjs.length}개 과목`, `총 ${total1}건`, `[예정] ${under1}개`, `[확정] ${closed1}개`, '']);
      rowHeights.push({ hpt: 24 });

      // 중간 구분 스페이서 행 (2행)
      rows.push([]);
      rows.push([]);
      rowHeights.push({ hpt: 14 }, { hpt: 14 });

      // ================= 2학기 테이블 =================
      const sem2Subjs = AppState.sem2Subjects || [];
      const closed2List = AppState.closedSubjects?.[2] || [];
      const memo2Map = AppState.subjectMemos?.[2] || {};
      const r2Start = rows.length;
      rows.push([`${acadYearStr} ${AppState.detectedGrade} [2학기] 과목별 수강 인원 및 개설·폐강 현황표`]);
      rows.push([`기준 인원: ${threshold}명 이하 | 전체 과목 수: ${sem2Subjs.length}개 | 출력일시: ${new Date().toLocaleString()}`]);
      rows.push([]);
      rows.push(['연번', '과목명', '수강 신청 인원', '개설 상태', '폐강 확정', '폐강 보류 및 비고 메모']);

      merges.push({ s: { r: r2Start, c: 0 }, e: { r: r2Start, c: 5 } });
      merges.push({ s: { r: r2Start + 1, c: 0 }, e: { r: r2Start + 1, c: 5 } });
      rowHeights.push({ hpt: 30 }, { hpt: 18 }, { hpt: 8 }, { hpt: 24 });

      let under2 = 0;
      let closed2 = 0;
      let total2 = 0;
      const fullSem2Subjs = [...sem2Subjs];

      fullSem2Subjs.forEach((s, idx) => {
        const normS = normalizeSubject(s);
        let count = 0;
        AppState.students.forEach(st => {
          if ((st.sem2 || []).some(sub => normalizeSubject(sub) === normS)) count++;
        });
        total2 += count;
        const isUnder = count <= threshold;
        if (isUnder) under2++;
        const isClosed = closed2List.some(c => normalizeSubject(c) === normS);
        if (isClosed) closed2++;

        const status = isClosed ? '[폐강 확정]' : (isUnder ? '[폐강 예정]' : '개설');
        const closedText = isClosed ? '확정 (제외)' : '';
        const memoText = memo2Map[s] || '';
        rows.push([idx + 1, s, `${count}명`, status, closedText, memoText]);
        rowHeights.push({ hpt: 20 });
      });

      const r2Sum = rows.length;
      rows.push(['합계', `전체 ${sem2Subjs.length}개 과목`, `총 ${total2}건`, `[예정] ${under2}개`, `[확정] ${closed2}개`, '']);
      rowHeights.push({ hpt: 24 });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!merges'] = merges;
      ws['!cols'] = [
        { wch: 8 },
        { wch: 26 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 32 }
      ];
      ws['!rows'] = rowHeights;

      // ==========================================
      // 파스텔 톤 엑셀 스타일링 테마 적용
      // ==========================================
      const pastelSem1 = {
        titleBg: 'EEF2FF',      // 부드러운 파스텔 라벤더/인디고
        titleText: '1E3A8A',    // 단정한 짙은 네이비 텍스트
        subBg: 'F8FAFC',        // 부드러운 슬레이트
        subText: '64748B',      // 슬레이트 그레이
        headerBg: 'E0E7FF',     // 파스텔 소프트 블루/인디고 헤더
        headerText: '1E3A8A',   // 짙은 네이비 볼드
        headerBorder: 'A5B4FC', // 파스텔 구분 테두리
        sumBg: 'EEF2FF',        // 합계 파스텔 인디고 배경
        sumText: '1E3A8A'       // 합계 네이비 텍스트
      };

      const pastelSem2 = {
        titleBg: 'ECFDF5',      // 부드러운 파스텔 민트/에메랄드
        titleText: '065F46',    // 단정한 짙은 그린/틸 텍스트
        subBg: 'F8FAFC',        // 부드러운 슬레이트
        subText: '64748B',      // 슬레이트 그레이
        headerBg: 'CCFBF1',     // 파스텔 소프트 민트 헤더
        headerText: '0F766E',   // 짙은 청록 볼드
        headerBorder: '5EEAD4', // 파스텔 민트 구분 테두리
        sumBg: 'ECFDF5',        // 합계 파스텔 민트 배경
        sumText: '065F46'       // 합계 틸 텍스트
      };

      const pastelCommon = {
        rowEven: 'F8FAFC',      // 은은한 슬레이트 화이트
        rowOdd: 'FFFFFF',       // 순백색
        borderSoft: 'CBD5E1',   // 부드러운 소프트 그리드 테두리
        closedBg: 'FEE2E2',     // 파스텔 로즈 (폐강 확정)
        closedText: 'DC2626',   // 부드러운 레드
        underBg: 'FEF3C7',      // 파스텔 웜 앰버 (폐강 예정)
        underText: 'B45309',    // 차분한 앰버 브라운
        openBg: 'F0FDF4',       // 파스텔 라이트 그린 (개설 상태)
        openText: '15803D'      // 차분한 그린
      };

      const softBorder = {
        top: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
        bottom: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
        left: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
        right: { style: 'thin', color: { rgb: pastelCommon.borderSoft } }
      };

      // 1학기 타이틀 & 부제목 (파스텔 톤)
      ExcelStyler.setRange(ws, r1Start, 0, r1Start, 5, {
        font: { name: ExcelStyler.fontFamily, sz: 13, bold: true, color: { rgb: pastelSem1.titleText } },
        fill: { fgColor: { rgb: pastelSem1.titleBg } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '93C5FD' } },
          bottom: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
          left: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
          right: { style: 'thin', color: { rgb: pastelCommon.borderSoft } }
        }
      });
      ExcelStyler.setRange(ws, r1Start + 1, 0, r1Start + 1, 5, {
        font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: pastelSem1.subText } },
        fill: { fgColor: { rgb: pastelSem1.subBg } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
          bottom: { style: 'medium', color: { rgb: '93C5FD' } },
          left: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
          right: { style: 'thin', color: { rgb: pastelCommon.borderSoft } }
        }
      });

      // 1학기 헤더 행 (파스텔 소프트 인디고)
      for (let c = 0; c < 6; c++) {
        ExcelStyler.setCell(ws, r1Start + 3, c, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: pastelSem1.headerText } },
          fill: { fgColor: { rgb: pastelSem1.headerBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: pastelSem1.headerBorder } },
            bottom: { style: 'medium', color: { rgb: pastelSem1.headerBorder } },
            left: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
            right: { style: 'thin', color: { rgb: pastelCommon.borderSoft } }
          }
        });
      }

      // 1학기 데이터 행
      fullSem1Subjs.forEach((s, idx) => {
        const r = r1Start + 4 + idx;
        const isEven = idx % 2 === 1;
        let count = 0;
        const normS = normalizeSubject(s);
        AppState.students.forEach(st => {
          if ((st.sem1 || []).some(sub => normalizeSubject(sub) === normS)) count++;
        });
        if (!sem1Subjs.includes(s) && prev1InfoMap[s]) count = prev1InfoMap[s].count || 0;
        const isUnder = count <= threshold;
        const isClosed = closed1List.includes(s) || prev1ClosedSet.has(s);

        const rowBg = isClosed ? pastelCommon.closedBg : (isUnder ? pastelCommon.underBg : (isEven ? pastelCommon.rowEven : pastelCommon.rowOdd));
        const textColor = isClosed ? pastelCommon.closedText : (isUnder ? pastelCommon.underText : ExcelStyler.colors.slateText);

        // 연번 (중앙)
        ExcelStyler.setCell(ws, r, 0, {
          font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: textColor } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });

        // 과목명 (좌측, 볼드)
        ExcelStyler.setCell(ws, r, 1, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: textColor } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: softBorder
        });

        // 수강 신청 인원 (중앙, 볼드)
        ExcelStyler.setCell(ws, r, 2, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: textColor } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });

        // 개설 상태 (중앙, 상태별 파스텔 뱃지 색감)
        const statusBg = isClosed ? pastelCommon.closedBg : (isUnder ? pastelCommon.underBg : pastelCommon.openBg);
        const statusColor = isClosed ? pastelCommon.closedText : (isUnder ? pastelCommon.underText : pastelCommon.openText);
        ExcelStyler.setCell(ws, r, 3, {
          font: { name: ExcelStyler.fontFamily, sz: 9.5, bold: true, color: { rgb: statusColor } },
          fill: { fgColor: { rgb: statusBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });

        // 폐강 확정 (중앙)
        ExcelStyler.setCell(ws, r, 4, {
          font: { name: ExcelStyler.fontFamily, sz: 9.5, bold: isClosed, color: { rgb: isClosed ? pastelCommon.closedText : textColor } },
          fill: { fgColor: { rgb: isClosed ? pastelCommon.closedBg : rowBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });

        // 폐강 보류 및 비고 메모 (좌측)
        ExcelStyler.setCell(ws, r, 5, {
          font: { name: ExcelStyler.fontFamily, sz: 9, color: { rgb: ExcelStyler.colors.slateMuted } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: softBorder
        });
      });

      // 1학기 합계 행 (파스텔 소프트 인디고 요약)
      for (let c = 0; c < 6; c++) {
        ExcelStyler.setCell(ws, r1Sum, c, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: pastelSem1.sumText } },
          fill: { fgColor: { rgb: pastelSem1.sumBg } },
          alignment: { horizontal: c === 1 || c === 5 ? 'left' : 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: pastelSem1.headerBorder } },
            bottom: { style: 'double', color: { rgb: pastelSem1.headerBorder } },
            left: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
            right: { style: 'thin', color: { rgb: pastelCommon.borderSoft } }
          }
        });
      }

      // 2학기 타이틀 & 부제목 (파스텔 소프트 민트 톤)
      ExcelStyler.setRange(ws, r2Start, 0, r2Start, 5, {
        font: { name: ExcelStyler.fontFamily, sz: 13, bold: true, color: { rgb: pastelSem2.titleText } },
        fill: { fgColor: { rgb: pastelSem2.titleBg } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '6EE7B7' } },
          bottom: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
          left: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
          right: { style: 'thin', color: { rgb: pastelCommon.borderSoft } }
        }
      });
      ExcelStyler.setRange(ws, r2Start + 1, 0, r2Start + 1, 5, {
        font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: pastelSem2.subText } },
        fill: { fgColor: { rgb: pastelSem2.subBg } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
          bottom: { style: 'medium', color: { rgb: '6EE7B7' } },
          left: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
          right: { style: 'thin', color: { rgb: pastelCommon.borderSoft } }
        }
      });

      // 2학기 헤더 행 (파스텔 소프트 민트)
      for (let c = 0; c < 6; c++) {
        ExcelStyler.setCell(ws, r2Start + 3, c, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: pastelSem2.headerText } },
          fill: { fgColor: { rgb: pastelSem2.headerBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: pastelSem2.headerBorder } },
            bottom: { style: 'medium', color: { rgb: pastelSem2.headerBorder } },
            left: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
            right: { style: 'thin', color: { rgb: pastelCommon.borderSoft } }
          }
        });
      }

      // 2학기 데이터 행
      fullSem2Subjs.forEach((s, idx) => {
        const r = r2Start + 4 + idx;
        const isEven = idx % 2 === 1;
        let count = 0;
        const normS = normalizeSubject(s);
        AppState.students.forEach(st => {
          if ((st.sem2 || []).some(sub => normalizeSubject(sub) === normS)) count++;
        });
        if (!sem2Subjs.includes(s) && prev2InfoMap[s]) count = prev2InfoMap[s].count || 0;
        const isUnder = count <= threshold;
        const isClosed = closed2List.includes(s) || prev2ClosedSet.has(s);

        const rowBg = isClosed ? pastelCommon.closedBg : (isUnder ? pastelCommon.underBg : (isEven ? pastelCommon.rowEven : pastelCommon.rowOdd));
        const textColor = isClosed ? pastelCommon.closedText : (isUnder ? pastelCommon.underText : ExcelStyler.colors.slateText);

        // 연번 (중앙)
        ExcelStyler.setCell(ws, r, 0, {
          font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: textColor } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });

        // 과목명 (좌측, 볼드)
        ExcelStyler.setCell(ws, r, 1, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: textColor } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: softBorder
        });

        // 수강 신청 인원 (중앙, 볼드)
        ExcelStyler.setCell(ws, r, 2, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: textColor } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });

        // 개설 상태 (중앙, 상태별 파스텔 뱃지 색감)
        const statusBg = isClosed ? pastelCommon.closedBg : (isUnder ? pastelCommon.underBg : pastelCommon.openBg);
        const statusColor = isClosed ? pastelCommon.closedText : (isUnder ? pastelCommon.underText : pastelCommon.openText);
        ExcelStyler.setCell(ws, r, 3, {
          font: { name: ExcelStyler.fontFamily, sz: 9.5, bold: true, color: { rgb: statusColor } },
          fill: { fgColor: { rgb: statusBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });

        // 폐강 확정 (중앙)
        ExcelStyler.setCell(ws, r, 4, {
          font: { name: ExcelStyler.fontFamily, sz: 9.5, bold: isClosed, color: { rgb: isClosed ? pastelCommon.closedText : textColor } },
          fill: { fgColor: { rgb: isClosed ? pastelCommon.closedBg : rowBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });

        // 폐강 보류 및 비고 메모 (좌측)
        ExcelStyler.setCell(ws, r, 5, {
          font: { name: ExcelStyler.fontFamily, sz: 9, color: { rgb: ExcelStyler.colors.slateMuted } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: softBorder
        });
      });

      // 2학기 합계 행 (파스텔 소프트 민트 요약)
      for (let c = 0; c < 6; c++) {
        ExcelStyler.setCell(ws, r2Sum, c, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: pastelSem2.sumText } },
          fill: { fgColor: { rgb: pastelSem2.sumBg } },
          alignment: { horizontal: c === 1 || c === 5 ? 'left' : 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: pastelSem2.headerBorder } },
            bottom: { style: 'double', color: { rgb: pastelSem2.headerBorder } },
            left: { style: 'thin', color: { rgb: pastelCommon.borderSoft } },
            right: { style: 'thin', color: { rgb: pastelCommon.borderSoft } }
          }
        });
      }

      // ================= 페이지 인쇄 및 영역 설정 (한 페이지 인쇄 최적화) =================
      ws['!pageSetup'] = {
        paperSize: 9,            // A4 규격
        orientation: 'portrait', // 세로 방향
        fitToWidth: 1,           // 너비 1페이지 맞춤
        fitToHeight: 1,          // 높이 1페이지 맞춤
        fitToPage: true          // 1페이지 인쇄 활성화
      };

      ws['!sheetPr'] = {
        pageSetUpPr: {
          fitToPage: true
        }
      };

      ws['!printOptions'] = {
        horizontalCentered: true
      };

      // 좁은 여백 설정 (A4 1페이지에 안정적으로 수용되도록 여백 조정)
      ws['!margins'] = {
        left: 0.4,
        right: 0.4,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2
      };

      // 인쇄 영역 설정 (A1부터 마지막 합계행 F열까지, 총 6개 열)
      wb.Workbook = wb.Workbook || {};
      wb.Workbook.Names = wb.Workbook.Names || [];
      wb.Workbook.Names.push({
        Name: '_xlnm.Print_Area',
        Ref: `'과목별_개설_폐강현황'!$A$1:$F$${rows.length}`,
        Sheet: 0
      });

      XLSX.utils.book_append_sheet(wb, ws, `과목별_개설_폐강현황`);

      // 다운로드 날짜 기입 (_YYMMDD 포맷, 예: _260101)
      const fileName = buildExportFileName(`${AppState.detectedGrade} 과목별 개설 폐강현황표`, "xlsx");
      window.saveExcelFile(wb, fileName);
    } catch (err) {
      console.error('exportSubjectSummaryExcel error:', err);
      alert('과목별 개설·폐강 현황표 엑셀 다운로드 중 오류가 발생했습니다: ' + err.message);
    }
  }

  // Step 1 Single Excel Export (1학기 & 2학기 탭 구성)
  btnExportStep1?.addEventListener('click', () => {
    exportStep1Excel();
  });

  function exportStep1Excel() {
    try {
      if (!AppState.students || AppState.students.length === 0) {
        alert('다운로드할 1단계 학생 수강신청 데이터가 없습니다. 먼저 엑셀 파일을 업로드해주세요.');
        return;
      }

      const wb = XLSX.utils.book_new();

      [1, 2].forEach(sem => {
        const subjects = (sem === 1 ? AppState.sem1Subjects : AppState.sem2Subjects) || [];
        const threshold = AppState.step1Threshold;
        const counts = {};
        const normMap = {};
        subjects.forEach(s => {
          counts[s] = 0;
          normMap[normalizeSubject(s)] = s;
        });
        AppState.students.forEach(st => {
          (sem === 1 ? st.sem1 : st.sem2).forEach(s => {
            const canonical = normMap[normalizeSubject(s)] || s;
            if (counts[canonical] !== undefined) counts[canonical]++;
          });
        });

        // 1. Matrix Table Rows
        const totalCols = 4 + subjects.length;
        const sheetData = [];
        sheetData.push([`[상지대관령고등학교] ${AppState.detectedGrade} [${sem}학기] 학생별 선택과목 매트릭스 현황`]);
        sheetData.push([`총 학생 수: ${AppState.students.length}명 | 1인당 선택: ${sem === 1 ? AppState.sem1GroupCount : AppState.sem2GroupCount}과목 | 기준 인원: ${threshold}명 이하 | 출력일시: ${new Date().toLocaleString()}`]);
        sheetData.push([]);

        // Table 1 Header Row
        sheetData.push(['반', '번호', '이름', '진로/관심학과', ...subjects]);

        // Student Rows
        AppState.students.forEach(st => {
          const selected = sem === 1 ? st.sem1 : st.sem2;
          const row = [st.classNum, st.studentNum, st.name, st.career];
          subjects.forEach(s => {
            const normS = normalizeSubject(s);
            const isSel = selected.some(sub => normalizeSubject(sub) === normS);
            row.push(isSel ? '선택' : '');
          });
          sheetData.push(row);
        });

        // Blank row spacer to isolate Student Table from Summary Totals (excludes Totals from Excel AutoFilter)
        sheetData.push([]);

        // Total Row
        const totalRow = ['합계', '', '', '총 수강 신청 인원'];
        subjects.forEach(s => totalRow.push(counts[s]));
        sheetData.push(totalRow);

        // Blank rows spacer
        sheetData.push([]);
        sheetData.push([]);

        // 2. Subject Summary & Retention Table (과목별 수강 인원 및 개설·폐강 현황)
        const t2Start = sheetData.length;
        const acadYearStr = MultiState.activeAcademicYear || '2027학년도';
        sheetData.push([`${acadYearStr} ${AppState.detectedGrade} [${sem}학기] 과목별 수강 인원 및 개설·폐강 현황표`]);
        sheetData.push(['연번', '과목명', '수강 신청 인원', '개설 상태', '폐강 확정', '폐강 보류 및 비고 메모']);

        const closedList = AppState.closedSubjects?.[sem] || [];
        const memoMap = AppState.subjectMemos?.[sem] || {};

        subjects.forEach((subj, idx) => {
          let count = counts[subj] || 0;
          const isClosed = closedList.includes(subj);
          const memo = memoMap[subj] || '';
          const status = isClosed ? '[폐강 확정]' : (count <= threshold ? '[폐강 예정]' : '개설');
          const closedText = isClosed ? '확정 (제외)' : '';
          sheetData.push([idx + 1, subj, `${count}명`, status, closedText, memo]);
        });

        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        // Merges
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
          { s: { r: 5 + AppState.students.length, c: 0 }, e: { r: 5 + AppState.students.length, c: 2 } },
          { s: { r: t2Start, c: 0 }, e: { r: t2Start, c: 5 } }
        ];

        // Column widths for Step 1 sheet
        const colWidths = [
          { wch: 6 },
          { wch: 6 },
          { wch: 12 },
          { wch: 22 }
        ];
        subjects.forEach(() => colWidths.push({ wch: 16 }));
        ws['!cols'] = colWidths;

        const rowHeights = [
          { hpt: 32 },
          { hpt: 20 },
          { hpt: 10 },
          { hpt: 26 }
        ];

        // Style Table 1 (Matrix)
        ExcelStyler.setRange(ws, 0, 0, 0, totalCols - 1, ExcelStyler.titleStyle(true));
        ExcelStyler.setRange(ws, 1, 0, 1, totalCols - 1, ExcelStyler.subtitleStyle(true));

        for (let c = 0; c < 4; c++) {
          const isRight = (c === 3);
          ExcelStyler.setCell(ws, 3, c, ExcelStyler.headerStyle('1E40AF', isRight, c === 0));
        }
        for (let c = 4; c < totalCols; c++) {
          const isRight = (c === totalCols - 1);
          ExcelStyler.setCell(ws, 3, c, ExcelStyler.headerStyle('2563EB', isRight, c === 4));
        }

        AppState.students.forEach((st, idx) => {
          const r = 4 + idx;
          const isEven = idx % 2 === 1;
          rowHeights.push({ hpt: 22 });
          const selected = sem === 1 ? st.sem1 : st.sem2;

          ExcelStyler.setCell(ws, r, 0, ExcelStyler.dataCenter(isEven, false, true));
          ExcelStyler.setCell(ws, r, 1, ExcelStyler.dataCenter(isEven, false, false));
          ExcelStyler.setCell(ws, r, 2, ExcelStyler.dataBold(isEven, false, false));
          ExcelStyler.setCell(ws, r, 3, ExcelStyler.dataLeft(isEven, true, false)); // 진로 오른쪽 굵은 테두리

          subjects.forEach((s, sIdx) => {
            const c = 4 + sIdx;
            const normS = normalizeSubject(s);
            const isSel = selected.some(sub => normalizeSubject(sub) === normS);
            const isRight = (sIdx === subjects.length - 1);
            ExcelStyler.setCell(ws, r, c, isSel ? ExcelStyler.dataSelected(isEven, isRight, false) : ExcelStyler.dataCenter(isEven, isRight, false));
          });
        });

        // Blank spacer row height (isolates table from filter)
        rowHeights.push({ hpt: 12 });

        // Summary row styling
        const sumR = 5 + AppState.students.length;
        rowHeights.push({ hpt: 26 });
        for (let c = 0; c < 4; c++) {
          const isRight = (c === 3);
          ExcelStyler.setCell(ws, sumR, c, ExcelStyler.summaryStyle(false, isRight, c === 0));
        }
        subjects.forEach((s, sIdx) => {
          const c = 4 + sIdx;
          const isUnder = counts[s] <= threshold;
          const isRight = (sIdx === subjects.length - 1);
          ExcelStyler.setCell(ws, sumR, c, ExcelStyler.summaryStyle(isUnder, isRight, false));
        });

        rowHeights.push({ hpt: 10 });
        rowHeights.push({ hpt: 10 });

        // Style Table 2 (Subject Summary)
        rowHeights.push({ hpt: 28 }); // t2Start
        rowHeights.push({ hpt: 26 }); // t2Start + 1
        ExcelStyler.setRange(ws, t2Start, 0, t2Start, 5, ExcelStyler.subHeaderStyle(true, true));
        for (let c = 0; c < 6; c++) {
          ExcelStyler.setCell(ws, t2Start + 1, c, ExcelStyler.headerStyle(ExcelStyler.colors.navyMid, c === 5, c === 0));
        }

        subjects.forEach((subj, idx) => {
          const r = t2Start + 2 + idx;
          const isEven = idx % 2 === 1;
          rowHeights.push({ hpt: 22 });
          const count = counts[subj] || 0;
          const isUnder = count <= threshold;
          const isClosed = closedList.includes(subj);

          ExcelStyler.setCell(ws, r, 0, ExcelStyler.dataCenter(isEven, false, true));
          ExcelStyler.setCell(ws, r, 1, isClosed ? ExcelStyler.dataWarning(false, false) : ExcelStyler.dataBold(isEven, false, false));
          ExcelStyler.setCell(ws, r, 2, isUnder ? ExcelStyler.dataWarning(false, false) : ExcelStyler.dataCenter(isEven, false, false));
          ExcelStyler.setCell(ws, r, 3, (isClosed || isUnder) ? ExcelStyler.dataWarning(false, false) : ExcelStyler.dataCenter(isEven, false, false));
          ExcelStyler.setCell(ws, r, 4, isClosed ? ExcelStyler.dataWarning(false, false) : ExcelStyler.dataCenter(isEven, false, false));
          ExcelStyler.setCell(ws, r, 5, ExcelStyler.dataText(isEven, true, false));
        });

        ws['!rows'] = rowHeights;
        XLSX.utils.book_append_sheet(wb, ws, `${sem}학기 선택현황`);
      });

      const fileName = buildExportFileName(`${AppState.detectedGrade} 선택과목 1단계 현황표`, "xlsx");
      window.saveExcelFile(wb, fileName);
    } catch (err) {
      console.error('exportStep1Excel error:', err);
      alert('1단계 현황표 엑셀 다운로드 중 오류가 발생했습니다: ' + err.message);
    }
  }

    // ==========================================