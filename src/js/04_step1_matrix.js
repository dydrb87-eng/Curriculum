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

        // 3단계 진입 시 필터 초기화 (학년별 확인 지원: 2학년, 3학년, 또는 전체)
        if (typeof _step3ResultFilters !== 'undefined' && _step3ResultFilters) {
          _step3ResultFilters.grade = '3학년';
          _step3ResultFilters.status = 'all';
          _step3ResultFilters.classNum = 'all';
          _step3ResultFilters.categoryId = 'all';
          _step3ResultFilters.search = '';
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
        if (uploadSection) uploadSection.classList.add('hidden');
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

      // Step 3 검증 필터를 전체 학생 및 3학년(검증 대상)으로 맞춤
      if (typeof _step3ResultFilters !== 'undefined' && _step3ResultFilters) {
        _step3ResultFilters.status = 'all';
        _step3ResultFilters.grade = '3학년';
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

      // Step 3 검증 필터를 전체 학생 및 3학년(검증 대상)으로 맞춤
      if (typeof _step3ResultFilters !== 'undefined' && _step3ResultFilters) {
        _step3ResultFilters.status = 'all';
        _step3ResultFilters.grade = '3학년';
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

      // Compute revision diffs for active date & grade (최신 회차가 왼쪽인 역순 정렬)
      const { revisionColumns, studentDiffMap } = (typeof computeStudentRevisionDiffs === 'function')
        ? computeStudentRevisionDiffs(MultiState.activeYear, MultiState.activeGrade)
        : { revisionColumns: [], studentDiffMap: new Map() };

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

      // 우측 차수별 누가 변경 열 추가 (최신 회차가 왼쪽인 역순 배치)
      revisionColumns.forEach(revCol => {
        html += `<th class="p-2.5 text-center border-r border-slate-300 whitespace-nowrap min-w-[150px] bg-slate-200 text-slate-800 font-bold select-none text-xs" title="${revCol.targetDate} (직전 기준: ${revCol.prevDate})">
          <div class="flex items-center justify-center gap-1">
            <span class="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-black border border-indigo-300 shadow-2xs">[${revCol.roundTag}]</span>
            <span>변경 내역</span>
          </div>
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

        // 우측 차수별 누가 변경 열 내용 추가 (최신 회차가 왼쪽)
        const stKey = `${String(st.classNum || '').replace(/[^0-9]/g, '')}_${String(st.studentNum || '').replace(/[^0-9]/g, '')}_${String(st.name || '').trim()}`;
        const diffs = studentDiffMap.get(stKey) || studentDiffMap.get(st.id) || {};

        revisionColumns.forEach(revCol => {
          const diffText = diffs[revCol.colId] || '-';
          const hasChange = diffText !== '-';

          if (hasChange) {
            html += `<td class="p-2 border-r border-slate-200 text-xs text-slate-900 bg-amber-50/80 font-medium whitespace-nowrap text-left" title="${diffText}">
              <span class="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-2xs text-[11px]">
                ${diffText}
              </span>
            </td>`;
          } else {
            html += `<td class="p-2 border-r border-slate-200 text-center text-xs text-slate-300 font-normal select-none">
              -
            </td>`;
          }
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
      revisionColumns.forEach(() => {
        html += '<td class="p-2.5 text-center border-r border-slate-300 text-xs text-slate-400 font-normal bg-slate-200 select-none">-</td>';
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

    // Toggle Subject Closed (폐강 확정 / 해제 - 현재 탭 고유 상태 관리, 2단계 기존 배치 보존)
    window.toggleSubjectClosed = function(subjectName) {
      const sem = AppState.currentSemester;
      if (!AppState.closedSubjects) AppState.closedSubjects = { 1: [], 2: [] };
      if (!AppState.closedSubjects[sem]) AppState.closedSubjects[sem] = [];
      AppState._closedImportedFromPrev = true;

      const normTarget = normalizeSubject(subjectName);
      const idx = AppState.closedSubjects[sem].findIndex(s => normalizeSubject(s) === normTarget);

      let plan = AppState.currentPlans?.[sem] || (AppState.currentSemester === sem ? AppState.currentPlan : null);

      if (idx >= 0) {
        // 폐강 해제 -> 2단계 플랜이 있다면 1그룹에 복귀 추가
        AppState.closedSubjects[sem].splice(idx, 1);
        if (plan && plan.groups && plan.groups.length > 0) {
          const exists = plan.groups.some(g => g.some(s => normalizeSubject(s.replace(/-[A-Z]$/, '')) === normTarget));
          if (!exists) {
            if (!plan.groups[0]) plan.groups[0] = [];
            plan.groups[0].push(subjectName);
            if (typeof analyzeGroupConflicts === 'function') {
              const analysis = analyzeGroupConflicts(plan);
              plan.conflictCount = analysis.conflictStudentCount;
              plan.conflicts = analysis.conflictDetails;
            }
          }
        }
      } else {
        // 폐강 확정 -> 2단계 플랜에서 해당 과목만 그룹에서 안전 제거 (다른 과목의 배치는 100% 보존!)
        AppState.closedSubjects[sem].push(subjectName);
        if (AppState.splitSubjects?.[sem]?.[subjectName]) {
          delete AppState.splitSubjects[sem][subjectName];
        }
        if (AppState.pinnedSubjects?.[sem]?.[subjectName]) {
          delete AppState.pinnedSubjects[sem][subjectName];
        }
        if (plan && plan.groups && plan.groups.length > 0) {
          plan.groups = plan.groups.map(grp => grp.filter(s => normalizeSubject(s.replace(/-[A-Z]$/, '')) !== normTarget));
          if (typeof analyzeGroupConflicts === 'function') {
            const analysis = analyzeGroupConflicts(plan);
            plan.conflictCount = analysis.conflictStudentCount;
            plan.conflicts = analysis.conflictDetails;
          }
        }
      }

      renderSubjectSummaryTable();
      initStep2Controls();

      // 플랜이 아예 없을 때만 최초 자동 생성(runOptimization) 실행
      if (!plan || !plan.groups || plan.groups.length === 0) {
        runOptimization();
      }

      renderStep2Results();
      renderSavedPlansList();
      saveAllState();
    };

    // ==========================================
    // 1단계 과목 추가 모달 및 로직 (2단계 1그룹 자동 연동)
    // ==========================================
    window.openAddSubjectStep1Modal = function() {
      const activeGrade = MultiState.activeGrade || AppState.detectedGrade || '2학년';
      const activeSem = AppState.currentSemester || 1;
      const currentAY = MultiState.activeAcademicYear || '2027학년도';

      const badge = document.getElementById('addSubjectStep1ContextBadge');
      if (badge) badge.textContent = `${currentAY} ${activeGrade}`;

      const r1 = document.getElementById('addSubjectStep1Sem1');
      const r2 = document.getElementById('addSubjectStep1Sem2');
      if (activeSem === 2) {
        if (r2) r2.checked = true;
      } else {
        if (r1) r1.checked = true;
      }

      const input = document.getElementById('addSubjectStep1NameInput');
      if (input) input.value = '';

      const modal = document.getElementById('addSubjectStep1Modal');
      if (modal) modal.classList.remove('hidden');
      setTimeout(() => input?.focus(), 50);
    };

    window.closeAddSubjectStep1Modal = function() {
      const modal = document.getElementById('addSubjectStep1Modal');
      if (modal) modal.classList.add('hidden');
    };

    window.confirmAddSubjectStep1 = function() {
      const input = document.getElementById('addSubjectStep1NameInput');
      if (!input) return;

      const rawName = input.value.trim();
      if (!rawName) {
        alert('추가할 과목명을 입력해주세요.');
        input.focus();
        return;
      }

      const cleanName = rawName.replace(/^[*※★☆\s]+/, '').replace(/-[A-Z]$/, '').trim();
      if (!cleanName) {
        alert('올바른 과목명을 입력해주세요.');
        input.focus();
        return;
      }

      const r2 = document.getElementById('addSubjectStep1Sem2');
      const sem = (r2 && r2.checked) ? 2 : 1;
      const curSemSubjs = (sem === 1 ? AppState.sem1Subjects : AppState.sem2Subjects) || [];
      const normNew = normalizeSubject(cleanName);

      // 1. 이미 개설된 과목인지 확인
      const isAlreadyInSem = curSemSubjs.some(s => normalizeSubject(s) === normNew);
      const curClosed = AppState.closedSubjects?.[sem] || [];
      const isClosedInCurrent = curClosed.some(s => normalizeSubject(s) === normNew);

      if (isAlreadyInSem && !isClosedInCurrent) {
        alert(`⚠️ [${cleanName}] 과목은 이미 ${sem}학기에 개설되어 있는 과목입니다.`);
        input.focus();
        return;
      }

      // 2. 만약 이미 존재하지만 폐강 상태였다면 -> 폐강 해제 처리
      if (isClosedInCurrent) {
        if (confirm(`ℹ️ [${cleanName}] 과목은 현재 ${sem}학기에 폐강 상태로 등록되어 있습니다.\n\n폐강을 해제하고 정상 개설 과목으로 전환하시겠습니까?`)) {
          AppState.closedSubjects[sem] = AppState.closedSubjects[sem].filter(s => normalizeSubject(s) !== normNew);
        } else {
          return;
        }
      } else {
        // 1단계 과목 목록에 추가
        curSemSubjs.push(cleanName);
        curSemSubjs.sort((a, b) => a.localeCompare(b, 'ko'));
        if (sem === 1) AppState.sem1Subjects = curSemSubjs;
        else AppState.sem2Subjects = curSemSubjs;
      }

      // 3. 비고 메모에 신설 이력 자동 기록
      if (!AppState.subjectMemos) AppState.subjectMemos = { 1: {}, 2: {} };
      if (!AppState.subjectMemos[sem]) AppState.subjectMemos[sem] = {};
      const activeDateStr = MultiState.activeYear || '';
      const memoText = activeDateStr ? `[${activeDateStr} 1단계 과목 신설]` : '[1단계 과목 신설]';
      if (!AppState.subjectMemos[sem][cleanName]) {
        AppState.subjectMemos[sem][cleanName] = memoText;
      } else if (!AppState.subjectMemos[sem][cleanName].includes('신설')) {
        AppState.subjectMemos[sem][cleanName] = `${AppState.subjectMemos[sem][cleanName]} ${memoText}`.trim();
      }

      // 4. 2단계 플랜에 1그룹(Group 1)으로 자동 배치!
      if (!AppState.currentPlans) AppState.currentPlans = { 1: null, 2: null };
      let plan = AppState.currentPlans[sem];
      if (!plan && AppState.currentPlan && AppState.currentPlan.semester === sem) {
        plan = AppState.currentPlan;
      }

      if (plan && plan.groups && plan.groups.length > 0) {
        // 1그룹(groups[0])에 없으면 추가
        const existsAnywhere = plan.groups.some(g => g.some(s => normalizeSubject(s.replace(/-[A-Z]$/, '')) === normNew));
        if (!existsAnywhere) {
          if (!plan.groups[0]) plan.groups[0] = [];
          plan.groups[0].push(cleanName);
        }
        if (typeof analyzeGroupConflicts === 'function') {
          const analysis = analyzeGroupConflicts(plan);
          plan.conflictCount = analysis.conflictStudentCount;
          plan.conflicts = analysis.conflictDetails;
        }
        AppState.currentPlans[sem] = plan;
        if (AppState.currentSemester === sem) {
          AppState.currentPlan = plan;
        }
      }

      // 5. 전체 상태 저장 & UI 갱신
      saveAllState();

      renderSubjectSummaryTable();
      if (typeof initStep1Filters === 'function') initStep1Filters();
      if (typeof renderStep2Results === 'function') renderStep2Results();

      window.closeAddSubjectStep1Modal();

      alert(`✅ [${cleanName}] 과목이 ${sem}학기 1단계에 성공적으로 추가되었습니다!\n\n- 1단계 현황표(신설 뱃지 및 비고 이력)에 즉시 반영되었습니다.\n- 2단계 1그룹에 자동으로 추가 배치되었습니다.\n- 2단계 화면에서 원하는 그룹으로 자유롭게 이동시킬 수 있습니다.`);
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

        // Compute revision diffs for active date & grade (최신 회차가 왼쪽인 역순 정렬)
        const { revisionColumns, studentDiffMap } = (typeof computeStudentRevisionDiffs === 'function')
          ? computeStudentRevisionDiffs(MultiState.activeYear, AppState.detectedGrade)
          : { revisionColumns: [], studentDiffMap: new Map() };
        const revHeaders = revisionColumns.map(rc => rc.colLabel);

        // 1. Matrix Table Rows
        const totalCols = 4 + subjects.length + revisionColumns.length;
        const sheetData = [];
        sheetData.push([`[상지대관령고등학교] ${AppState.detectedGrade} [${sem}학기] 학생별 선택과목 매트릭스 현황`]);
        sheetData.push([`총 학생 수: ${AppState.students.length}명 | 1인당 선택: ${sem === 1 ? AppState.sem1GroupCount : AppState.sem2GroupCount}과목 | 기준 인원: ${threshold}명 이하 | 출력일시: ${new Date().toLocaleString()}`]);
        sheetData.push([]);

        // Table 1 Header Row
        sheetData.push(['반', '번호', '이름', '진로/관심학과', ...subjects, ...revHeaders]);

        // Student Rows
        AppState.students.forEach(st => {
          const selected = sem === 1 ? st.sem1 : st.sem2;
          const row = [st.classNum, st.studentNum, st.name, st.career];
          subjects.forEach(s => {
            const normS = normalizeSubject(s);
            const isSel = selected.some(sub => normalizeSubject(sub) === normS);
            row.push(isSel ? '선택' : '');
          });
          const stKey = `${String(st.classNum || '').replace(/[^0-9]/g, '')}_${String(st.studentNum || '').replace(/[^0-9]/g, '')}_${String(st.name || '').trim()}`;
          const diffs = studentDiffMap.get(stKey) || studentDiffMap.get(st.id) || {};
          revisionColumns.forEach(rc => {
            row.push(diffs[rc.colId] || '-');
          });
          sheetData.push(row);
        });

        // Blank row spacer to isolate Student Table from Summary Totals (excludes Totals from Excel AutoFilter)
        sheetData.push([]);

        // Total Row
        const totalRow = ['합계', '', '', '총 수강 신청 인원'];
        subjects.forEach(s => totalRow.push(counts[s]));
        revisionColumns.forEach(() => totalRow.push('-'));
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
        revisionColumns.forEach(() => colWidths.push({ wch: 28 }));
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
            const isRight = (sIdx === subjects.length - 1 && revisionColumns.length === 0);
            ExcelStyler.setCell(ws, r, c, isSel ? ExcelStyler.dataSelected(isEven, isRight, false) : ExcelStyler.dataCenter(isEven, isRight, false));
          });

          revisionColumns.forEach((rc, rcIdx) => {
            const c = 4 + subjects.length + rcIdx;
            const isRight = (rcIdx === revisionColumns.length - 1);
            const val = sheetData[r][c];
            const hasChange = val && val !== '-';
            if (hasChange) {
              ExcelStyler.setCell(ws, r, c, {
                font: { name: ExcelStyler.fontFamily, sz: 9.5, bold: true, color: { rgb: '78350F' } },
                fill: { fgColor: { rgb: 'FEF3C7' } },
                alignment: { horizontal: 'left', vertical: 'center' },
                border: ExcelStyler.dataBorder(isRight, false)
              });
            } else {
              ExcelStyler.setCell(ws, r, c, ExcelStyler.dataCenter(isEven, isRight, false));
            }
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
          const isRight = (sIdx === subjects.length - 1 && revisionColumns.length === 0);
          ExcelStyler.setCell(ws, sumR, c, ExcelStyler.summaryStyle(isUnder, isRight, false));
        });
        revisionColumns.forEach((rc, rcIdx) => {
          const c = 4 + subjects.length + rcIdx;
          const isRight = (rcIdx === revisionColumns.length - 1);
          ExcelStyler.setCell(ws, sumR, c, ExcelStyler.summaryStyle(false, isRight, false));
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
    // NEIS 입학생 3개년 교육과정 편성표 파서 & 대조/일치화(Harmonization) 모듈
    // ==========================================

    function chmEscapeHtml(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // CSV 텍스트 한 줄씩 파싱 (따옴표 및 쉼표 정밀 처리)
    function parseNeisCsvRows(text) {
      if (!text) return [];
      const lines = text.split(/\r\n|\n|\r/);
      const rows = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cells = [];
        let inQuotes = false;
        let token = '';
        for (let c = 0; c < line.length; c++) {
          const ch = line[c];
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            cells.push(token.trim());
            token = '';
          } else {
            token += ch;
          }
        }
        cells.push(token.trim());
        rows.push(cells);
      }
      return rows;
    }
    window.parseNeisCsvRows = parseNeisCsvRows;

    // 나이스 입학생 교육과정 편성표 2차원 배열 동적 파서 (헤더 자동 감지, 셀 병합 해제 및 forward-fill, 시수/지정선택 자동 산출)
    function parseNeisCurriculumRows(rawRows, academicYear = '') {
      if (!Array.isArray(rawRows) || rawRows.length === 0) return { subjects: [], academicYear, totalCount: 0 };

      // 1. 헤더 행 탐색을 통한 컬럼 인덱스 동적 감지 (여백 컬럼이나 컬럼 이동에 100% 대응)
      const colMap = {
        gubun: -1,
        domain: -1,
        category: -1,
        subjType: -1,
        subjName: -1,
        g1_s1: -1,
        g1_s2: -1,
        g2_s1: -1,
        g2_s2: -1,
        g3_s1: -1,
        g3_s2: -1
      };

      for (let r = 0; r < Math.min(rawRows.length, 25); r++) {
        const rCells = (rawRows[r] || []).map(c => String(c || '').trim().replace(/"/g, ''));
        const rCompact = rCells.map(c => c.replace(/\s+/g, ''));
        if (rCompact.some(c => /^과목명$|^과목$|^개설과목$|^교과목$/.test(c))) {
          rCompact.forEach((c, idx) => {
            if (/^구분$/.test(c)) colMap.gubun = idx;
            else if (/^교과영역$|^교과$/.test(c)) colMap.domain = idx;
            else if (c.includes('교과(군)') || c === '교과군' || c === '교과') colMap.category = idx;
            else if (/^과목구분$/.test(c)) colMap.subjType = idx;
            else if (/^과목명$|^과목$|^개설과목$|^교과목$/.test(c)) colMap.subjName = idx;
          });

          // 다음 행에서 학기(1학기, 2학기) 컬럼 인덱스 감지
          if (r + 1 < rawRows.length) {
            const nextCells = (rawRows[r + 1] || []).map(c => String(c || '').trim());
            const semIndices = [];
            nextCells.forEach((c, idx) => {
              if (c.includes('학기')) semIndices.push(idx);
            });
            if (semIndices.length >= 6) {
              colMap.g1_s1 = semIndices[0];
              colMap.g1_s2 = semIndices[1];
              colMap.g2_s1 = semIndices[2];
              colMap.g2_s2 = semIndices[3];
              colMap.g3_s1 = semIndices[4];
              colMap.g3_s2 = semIndices[5];
            }
          }
          break;
        }
      }

      // 감지되지 않은 컬럼은 나이스 표준 기본값으로 fallback
      if (colMap.subjName === -1) colMap.subjName = 6;
      if (colMap.gubun === -1) colMap.gubun = 1;
      if (colMap.domain === -1) colMap.domain = 2;
      if (colMap.category === -1) colMap.category = 4;
      if (colMap.subjType === -1) colMap.subjType = 5;
      if (colMap.g1_s1 === -1) colMap.g1_s1 = 8;
      if (colMap.g1_s2 === -1) colMap.g1_s2 = 11;
      if (colMap.g2_s1 === -1) colMap.g2_s1 = 13;
      if (colMap.g2_s2 === -1) colMap.g2_s2 = 14;
      if (colMap.g3_s1 === -1) colMap.g3_s1 = 16;
      if (colMap.g3_s2 === -1) colMap.g3_s2 = 17;

      let currentType = '';        // 학교지정 / 학생선택
      let currentDomain = '';      // 교과영역 (기초, 탐구, 체육·예술, 생활·교양 등)
      let currentCategory = '';    // 교과(군) (국어, 수학, 영어, 사회, 과학 등)
      let currentSubjType = '';    // 과목구분 (공통, 일반 선택, 진로 선택, 융합 선택)
      let currentElectiveGroup = null; // 학생선택 그룹 블록

      const subjects = [];
      const seenKeySet = new Set();

      for (let r = 0; r < rawRows.length; r++) {
        const row = rawRows[r] || [];
        const rowStr = row.map(c => String(c || '').trim()).filter(Boolean).join(' ');
        if (!rowStr) continue;

        // 1. 페이지 머리글, 문서 제목, 학교명, 헤더 반복행 필터링
        if (rowStr.includes('교육과정 편성표') || rowStr.includes('상지대관령고등학교')) continue;
        if (rowStr.includes('구분') && (rowStr.includes('과목명') || rowStr.includes('과목') || rowStr.includes('과 목'))) continue;
        if (/소계|합계|총이수학점|필수이수학점|선택이수학점/.test(rowStr)) continue;

        const rawGubun = (colMap.gubun >= 0 && colMap.gubun < row.length) ? String(row[colMap.gubun] || '').trim() : '';
        const rawDomain = (colMap.domain >= 0 && colMap.domain < row.length) ? String(row[colMap.domain] || '').trim() : '';
        const rawCat = (colMap.category >= 0 && colMap.category < row.length) ? String(row[colMap.category] || '').trim() : '';
        const rawSType = (colMap.subjType >= 0 && colMap.subjType < row.length) ? String(row[colMap.subjType] || '').trim() : '';
        const rawSName = (colMap.subjName >= 0 && colMap.subjName < row.length) ? String(row[colMap.subjName] || '').trim() : '';

        // 2. 구분(학교지정 / 학생선택) Forward-Fill
        if (rawGubun.includes('학교지정') || rawGubun.includes('지정')) {
          currentType = '학교지정';
          currentElectiveGroup = null;
        } else if (rawGubun.includes('학생선택') || rawGubun.includes('선택')) {
          currentType = '학생선택';
        }

        // 3. 교과영역 Forward-Fill
        if (rawDomain && !/^\d+$/.test(rawDomain)) {
          currentDomain = rawDomain;
        }

        // 4. 학생선택 블록 헤더 감지 ("2학년 1학기 선택과목(3)", "택 12학점", "3과목선택")
        // 나이스 편성표에서는 교과(군) 열 또는 과목명 열에 선택과목 그룹명이 배치됨
        const mGroup = rawCat.match(/([123])학년\s*([12])학기\s*선택과목(?:\s*\((\d+)\))?/) ||
                       rawSName.match(/([123])학년\s*([12])학기\s*선택과목(?:\s*\((\d+)\))?/);

        if (mGroup) {
          const targetG = parseInt(mGroup[1], 10);
          const targetS = parseInt(mGroup[2], 10);
          const pickCnt = mGroup[3] ? parseInt(mGroup[3], 10) : 3;

          let totalCredit = 0;
          for (let ci = 0; ci < row.length; ci++) {
            const mCr = String(row[ci] || '').match(/택\s*(\d+)학점/);
            if (mCr) {
              totalCredit = parseInt(mCr[1], 10);
              break;
            }
          }
          const creditPerSubj = (pickCnt > 0 && totalCredit > 0) ? Math.round(totalCredit / pickCnt) : 4;

          currentElectiveGroup = {
            name: mGroup[0],
            grade: targetG,
            sem: targetS,
            pickCount: pickCnt,
            totalCredit: totalCredit,
            creditPerSubject: creditPerSubj
          };
        } else {
          // 일반 교과(군) Forward-Fill
          if (rawCat && !rawCat.includes('선택과목') && !/^\d+$/.test(rawCat)) {
            currentCategory = rawCat;
          }
        }

        // 5. 과목구분 Forward-Fill
        if (rawSType && !/^\d+$/.test(rawSType)) {
          currentSubjType = rawSType;
        }

        // 6. 유효 과목명 검증
        if (!rawSName || rawSName.includes('선택과목') || /^과목명$|^과목$/.test(rawSName.replace(/\s+/g, ''))) continue;
        if (['공통', '일반 선택', '진로 선택', '융합 선택', '보통교과', '학교지정', '학생선택'].includes(rawSName)) continue;

        const cleanSubj = (typeof window.getBaseSubjectName === 'function')
          ? window.getBaseSubjectName(rawSName)
          : rawSName.replace(/[\(\[].*?[\)\]]/g, '').trim();

        if (!cleanSubj) continue;

        const isCommon = (currentSubjType === '공통') || /^공통국어|^공통수학|^공통영어|^한국사|^통합사회|^통합과학|^과학탐구실험/.test(cleanSubj);

        if (currentType === '학교지정') {
          // 학교지정 학년/학기 컬럼 시수 추출
          const pairs = [
            { grade: 1, sem: 1, col: colMap.g1_s1 },
            { grade: 1, sem: 2, col: colMap.g1_s2 },
            { grade: 2, sem: 1, col: colMap.g2_s1 },
            { grade: 2, sem: 2, col: colMap.g2_s2 },
            { grade: 3, sem: 1, col: colMap.g3_s1 },
            { grade: 3, sem: 2, col: colMap.g3_s2 },
          ];

          pairs.forEach(p => {
            if (p.col >= 0 && p.col < row.length) {
              const val = parseFloat(row[p.col]);
              if (!isNaN(val) && val > 0) {
                const dedupeKey = `${p.grade}::${p.sem}::${cleanSubj}`;
                if (!seenKeySet.has(dedupeKey)) {
                  seenKeySet.add(dedupeKey);
                  subjects.push({
                    grade: p.grade,
                    gradeStr: `${p.grade}학년`,
                    semester: p.sem,
                    type: '학교지정',
                    domain: currentDomain || '기초',
                    category: currentCategory || '교과',
                    subjectType: currentSubjType || (isCommon ? '공통' : '일반 선택'),
                    subject: cleanSubj,
                    hours: val,
                    isCommon: isCommon,
                    electiveGroupName: ''
                  });
                }
              }
            }
          });
        } else {
          // 학생선택 과목 파싱
          let targetGrade = currentElectiveGroup ? currentElectiveGroup.grade : 2;
          let targetSem = currentElectiveGroup ? currentElectiveGroup.sem : 1;
          let credit = currentElectiveGroup ? currentElectiveGroup.creditPerSubject : 4;

          const dedupeKey = `${targetGrade}::${targetSem}::${cleanSubj}`;
          if (!seenKeySet.has(dedupeKey)) {
            seenKeySet.add(dedupeKey);
            subjects.push({
              grade: targetGrade,
              gradeStr: `${targetGrade}학년`,
              semester: targetSem,
              type: '학생선택',
              domain: currentDomain || '탐구',
              category: currentCategory || '교과',
              subjectType: currentSubjType || '일반 선택',
              subject: cleanSubj,
              hours: credit,
              isCommon: isCommon,
              electiveGroupName: currentElectiveGroup ? currentElectiveGroup.name : ''
            });
          }
        }
      }

      return {
        academicYear: academicYear,
        totalCount: subjects.length,
        subjects: subjects,
        uploadedAt: new Date().toISOString()
      };
    }
    window.parseNeisCurriculumRows = parseNeisCurriculumRows;

    // CARD 0 UI 업데이트 (작업 탭 학년 전환 시 실시간 갱신)
    function updateNeisCurriculumCardUI() {
      const activeGrade = MultiState?.activeGrade || '2학년';
      const activeYear = MultiState?.activeAcademicYear || '2027학년도';
      const card = document.getElementById('neisCurriculumCard');
      if (!card) return;

      if (activeGrade === '전체') {
        card.classList.add('hidden');
        return;
      }
      card.classList.remove('hidden');

      const titleEl = document.getElementById('neisCurriculumCardTitle');
      const badgeEl = document.getElementById('neisCurriculumStatusBadge');
      const fileSummaryEl = document.getElementById('neisCurriculumFileSummary');
      const fileNameEl = document.getElementById('neisCurriculumFileName');
      const btnView = document.getElementById('btnViewNeisCurriculum');
      const btnHarmonize = document.getElementById('btnOpenHarmonizeModal');
      const btnClear = document.getElementById('btnClearNeisCurriculum');
      const dropZone = document.getElementById('neisCurriculumDropZone');

      if (titleEl) {
        titleEl.textContent = `[${activeGrade}] NEIS 입학생교육과정 편성표`;
      }

      // 현재 학년도 및 학년의 NEIS 교육과정 데이터 확인
      const neisMap = MultiState?.neisCurriculumsByAcademicYear?.[activeYear] || {};
      const neisData = AppState?.neisCurriculum || neisMap[activeGrade];

      if (neisData && Array.isArray(neisData.subjects) && neisData.subjects.length > 0) {
        // 등록 완료 상태
        const numGrade = parseInt(activeGrade.replace(/[^0-9]/g, '') || '2', 10);
        const gradeSubjs = neisData.subjects.filter(s => s.grade === numGrade);
        const designatedCount = gradeSubjs.filter(s => s.type === '학교지정').length;
        const electiveCount = gradeSubjs.filter(s => s.type === '학생선택').length;

        if (badgeEl) {
          badgeEl.textContent = `✅ 등록 완료 (${gradeSubjs.length}과목)`;
          badgeEl.className = 'text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs';
        }
        if (fileNameEl) {
          fileNameEl.textContent = `${neisData.fileName || 'NEIS 입학생교육과정 편성표'} [${activeGrade} ${gradeSubjs.length}과목: 지정 ${designatedCount}, 선택 ${electiveCount}]`;
        }
        if (fileSummaryEl) {
          fileSummaryEl.textContent = `공식 편성표가 성공적으로 분석되었습니다. [👁️ 편성표 보기] 또는 [📋 과목 대조 및 일치화]를 클릭해 확인하세요.`;
        }
        if (btnView) btnView.classList.remove('hidden');
        if (btnHarmonize) btnHarmonize.classList.remove('hidden');
        if (btnClear) btnClear.classList.remove('hidden');
        if (dropZone) {
          dropZone.classList.add('border-emerald-400', 'bg-emerald-50/50');
          dropZone.classList.remove('border-slate-300');
        }
      } else {
        // 미등록 상태
        if (badgeEl) {
          badgeEl.textContent = '미등록';
          badgeEl.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200';
        }
        if (fileNameEl) {
          fileNameEl.textContent = `NEIS 입학생교육과정 편성표 엑셀/CSV 파일을 이곳에 끌어다 놓거나 클릭하세요`;
        }
        if (fileSummaryEl) {
          fileSummaryEl.textContent = `나이스에서 다운로드한 엑셀(.xlsx) 또는 CSV 파일을 그대로 등록하면 셀 병합을 자동으로 풀고 정규화합니다.`;
        }
        if (btnView) btnView.classList.add('hidden');
        if (btnHarmonize) btnHarmonize.classList.add('hidden');
        if (btnClear) btnClear.classList.add('hidden');
        if (dropZone) {
          dropZone.classList.remove('border-emerald-400', 'bg-emerald-50/50');
          dropZone.classList.add('border-emerald-300');
        }
      }
    }
    window.updateNeisCurriculumCardUI = updateNeisCurriculumCardUI;

    function initNeisDropZone() {
      const dropZone = document.getElementById('neisCurriculumDropZone');
      if (!dropZone) return;
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-emerald-600', 'bg-emerald-100/60');
      });
      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-emerald-600', 'bg-emerald-100/60');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-emerald-600', 'bg-emerald-100/60');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          window.handleNeisCurriculumUpload(e.dataTransfer.files[0]);
        }
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initNeisDropZone);
    } else {
      initNeisDropZone();
    }

    // CARD 0 파일 업로드 핸들러
    window.handleNeisCurriculumUpload = function(file) {
      if (!file) return;
      const activeGrade = MultiState?.activeGrade || '2학년';
      const activeYear = MultiState?.activeAcademicYear || '2027학년도';

      if (typeof showLoading === 'function') {
        showLoading(`[${file.name}] 입학생 교육과정 편성표 분석 중...`);
      }

      const reader = new FileReader();
      const isCsv = file.name.toLowerCase().endsWith('.csv');

      reader.onload = function(e) {
        setTimeout(() => {
          try {
            let parsed = null;
            if (isCsv) {
              let csvText = '';
              try {
                const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
                csvText = utf8Decoder.decode(e.target.result);
              } catch (utfErr) {
                csvText = new TextDecoder('euc-kr').decode(e.target.result);
              }
              const rawRows = parseNeisCsvRows(csvText);
              parsed = parseNeisCurriculumRows(rawRows, activeYear);
            } else {
              if (typeof XLSX === 'undefined') {
                alert('엑셀 라이브러리(XLSX)를 로딩 중입니다. 잠시 후 다시 시도해주세요.');
                return;
              }
              const data = new Uint8Array(e.target.result);
              const wb = XLSX.read(data, { type: 'array' });
              const sheetName = wb.SheetNames[0];
              const sheet = wb.Sheets[sheetName];
              const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
              parsed = parseNeisCurriculumRows(rawRows, activeYear);
            }

            if (!parsed || parsed.subjects.length === 0) {
              alert('편성표에서 유효한 과목 데이터를 찾지 못했습니다. 나이스 [입학생 3개년 편성표] 양식인지 확인해주세요.');
              return;
            }

            parsed.fileName = file.name;
            parsed.academicYear = activeYear;

            // 1. 현재 학년 상태 및 MultiState에 저장
            AppState.neisCurriculum = parsed;
            if (!MultiState.neisCurriculumsByAcademicYear) MultiState.neisCurriculumsByAcademicYear = {};
            if (!MultiState.neisCurriculumsByAcademicYear[activeYear]) MultiState.neisCurriculumsByAcademicYear[activeYear] = {};
            MultiState.neisCurriculumsByAcademicYear[activeYear][activeGrade] = parsed;

            // 현재 날짜 컨텍스트에도 저장
            const curDate = MultiState?.activeYear;
            if (curDate && MultiState.data?.[activeYear]?.[curDate]?.[activeGrade]) {
              MultiState.data[activeYear][curDate][activeGrade].neisCurriculum = parsed;
            }

            // 2. UI 갱신 및 상태 저장
            updateNeisCurriculumCardUI();
            if (typeof saveAllState === 'function') saveAllState();

            // 3. 과목 대조 및 일치화 모달 즉시 열기
            setTimeout(() => {
              window.openCurriculumHarmonizeModal();
            }, 150);

          } catch (err) {
            console.error('handleNeisCurriculumUpload error:', err);
            alert('입학생 교육과정 파일 분석 중 오류가 발생했습니다: ' + err.message);
          } finally {
            if (typeof hideLoading === 'function') hideLoading();
          }
        }, 50);
      };

      reader.onerror = function() {
        if (typeof hideLoading === 'function') hideLoading();
        alert('파일을 읽는 데 실패했습니다.');
      };

      reader.readAsArrayBuffer(file);
    };

    // 입학생 교육과정 데이터 삭제
    window.clearNeisCurriculumForCurrentGrade = function() {
      const activeGrade = MultiState?.activeGrade || '2학년';
      const activeYear = MultiState?.activeAcademicYear || '2027학년도';

      if (!confirm(`현재 [${activeGrade}]의 입학생 교육과정 편성표 데이터를 삭제하시겠습니까?\n(기존 전체 시수종합 및 수강신청 데이터는 그대로 유지됩니다.)`)) {
        return;
      }

      AppState.neisCurriculum = null;
      if (MultiState.neisCurriculumsByAcademicYear?.[activeYear]) {
        delete MultiState.neisCurriculumsByAcademicYear[activeYear][activeGrade];
      }
      const curDate = MultiState?.activeYear;
      if (curDate && MultiState.data?.[activeYear]?.[curDate]?.[activeGrade]) {
        MultiState.data[activeYear][curDate][activeGrade].neisCurriculum = null;
      }

      updateNeisCurriculumCardUI();
      if (typeof saveAllState === 'function') saveAllState();
      alert(`[${activeGrade}] 입학생 교육과정 데이터가 삭제되었습니다.`);
    };

    // ==========================================
    // 대조 및 일치화(Harmonize) 모달 엔진
    // ==========================================
    window._chmWorkingList = [];
    window._chmCurrentFilter = 'all';

    window.openCurriculumHarmonizeModal = function() {
      const modal = document.getElementById('curriculumHarmonizeModal');
      if (!modal) return;

      const activeGrade = MultiState?.activeGrade || '2학년';
      const activeYear = MultiState?.activeAcademicYear || '2027학년도';
      const numGrade = parseInt(activeGrade.replace(/[^0-9]/g, '') || '2', 10);

      // 나이스 데이터 조회
      const neisMap = MultiState?.neisCurriculumsByAcademicYear?.[activeYear] || {};
      const neisData = AppState?.neisCurriculum || neisMap[activeGrade];

      if (!neisData || !Array.isArray(neisData.subjects) || neisData.subjects.length === 0) {
        alert(`현재 [${activeGrade}]에 등록된 나이스 입학생 교육과정 편성표가 없습니다.\n먼저 0번 카드에 엑셀/CSV 파일을 등록해주세요.`);
        return;
      }

      // 모달 상단 뱃지
      const badgeEl = document.getElementById('chmGradeBadge');
      if (badgeEl) {
        badgeEl.textContent = `[${activeYear} ${activeGrade} 기준]`;
      }

      // 1. NEIS 해당 학년 과목 필터링 (2학년은 2학년 과목, 3학년은 3학년 과목)
      const neisGradeSubjects = neisData.subjects.filter(s => s.grade === numGrade);

      // 2. 기존 시스템 데이터 수집
      // 2-1) 전체 시수종합 (curriculumByAcademicYear)
      const allCurric = (typeof getAllGradesCurriculum === 'function') ? getAllGradesCurriculum() : (MultiState?.curriculumByAcademicYear?.[activeYear] || []);
      const systemCurricGrade = allCurric.filter(c => {
        const cg = String(c.grade || '').trim();
        return cg.includes(String(numGrade));
      });

      // 2-2) 1단계 선택 과목 (AppState.sem1Subjects, sem2Subjects)
      const step1Sem1 = Array.isArray(AppState?.sem1Subjects) ? AppState.sem1Subjects : [];
      const step1Sem2 = Array.isArray(AppState?.sem2Subjects) ? AppState.sem2Subjects : [];

      // 3. 대조 비교 알고리즘
      const workingList = [];
      const matchedSystemIds = new Set();
      const matchedSystemKeys = new Set();

      // NEIS 과목 순회
      neisGradeSubjects.forEach((nSubj, idx) => {
        const normNeis = (typeof window.normalizeSubject === 'function')
          ? window.normalizeSubject(nSubj.subject)
          : nSubj.subject.replace(/\s+/g, '').toLowerCase();

        // 시스템 시수표에서 학기와 정규화 과목명이 일치하는 항목 탐색
        const sysMatches = systemCurricGrade.filter(c => {
          const cSem = parseInt(c.semester || 1, 10);
          if (cSem !== nSubj.semester) return false;
          const normSys = (typeof window.normalizeSubject === 'function')
            ? window.normalizeSubject(c.subject)
            : String(c.subject || '').replace(/\s+/g, '').toLowerCase();
          return normSys === normNeis;
        });

        // 1단계 과목 목록에서도 포함 여부 확인
        const inStep1 = (nSubj.semester === 1 ? step1Sem1 : step1Sem2).some(s => {
          const norm = (typeof window.normalizeSubject === 'function') ? window.normalizeSubject(s) : String(s).replace(/\s+/g, '').toLowerCase();
          return norm === normNeis;
        });

        if (sysMatches.length > 0) {
          // 일치 또는 미세 차이 발견
          sysMatches.forEach(sysMatch => {
            matchedSystemIds.add(sysMatch.id);
            matchedSystemKeys.add(`${sysMatch.semester}::${normNeis}`);

            const isExactName = (sysMatch.subject === nSubj.subject);
            const isExactHours = (Number(sysMatch.hours) === Number(nSubj.hours));
            const isExactCat = (sysMatch.category === (nSubj.type === '학교지정' ? '지정' : '선택'));

            const diffReasons = [];
            if (!isExactName) diffReasons.push(`띄어쓰기/표기 차이 ("${sysMatch.subject}" vs "${nSubj.subject}")`);
            if (!isExactHours) diffReasons.push(`시수 상이 (기존 ${sysMatch.hours}h vs 나이스 ${nSubj.hours}h)`);
            if (!isExactCat) diffReasons.push(`구분 상이 (기존 ${sysMatch.category} vs 나이스 ${nSubj.type})`);

            const isMatched = (diffReasons.length === 0);

            workingList.push({
              id: `item_${idx}_${sysMatch.id}`,
              status: isMatched ? 'MATCHED' : 'DIFF',
              grade: activeGrade,
              semester: nSubj.semester,
              neisItem: nSubj,
              systemItem: {
                id: sysMatch.id,
                subject: sysMatch.subject,
                hours: sysMatch.hours,
                category: sysMatch.category,
                division: sysMatch.division,
                teacher: sysMatch.teacher,
                originalTeacher: sysMatch.originalTeacher,
                inCurriculum: true,
                inStep1: inStep1
              },
              diffReasons: diffReasons,
              selectedStandard: 'NEIS' // 기본값: 나이스 기준 적용
            });
          });
        } else {
          // 시스템 시수표에는 없으나 1단계 선택과목에만 있는 경우
          if (inStep1) {
            matchedSystemKeys.add(`${nSubj.semester}::${normNeis}`);
            workingList.push({
              id: `item_${idx}_step1`,
              status: 'DIFF',
              grade: activeGrade,
              semester: nSubj.semester,
              neisItem: nSubj,
              systemItem: {
                subject: nSubj.subject,
                hours: nSubj.hours,
                category: '선택(1단계)',
                teacher: '',
                inCurriculum: false,
                inStep1: true
              },
              diffReasons: ['시수종합 미등록 (1단계 선택과목에는 존재)'],
              selectedStandard: 'NEIS'
            });
          } else {
            // 나이스에만 존재하는 신규 / 미개설 과목
            workingList.push({
              id: `item_${idx}_new`,
              status: 'NEIS_ONLY',
              grade: activeGrade,
              semester: nSubj.semester,
              neisItem: nSubj,
              systemItem: null,
              diffReasons: ['시스템에 미등록된 신규 과목'],
              selectedStandard: 'NEIS' // 신규 과목도 나이스 기준 추가가 기본
            });
          }
        }
      });

      // 시스템 시수표에만 있고 나이스에는 없는 과목 수집 (SYSTEM_ONLY)
      systemCurricGrade.forEach(c => {
        if (matchedSystemIds.has(c.id)) return;
        const normSys = (typeof window.normalizeSubject === 'function')
          ? window.normalizeSubject(c.subject)
          : String(c.subject || '').replace(/\s+/g, '').toLowerCase();
        const sem = parseInt(c.semester || 1, 10);
        if (matchedSystemKeys.has(`${sem}::${normSys}`)) return;

        workingList.push({
          id: `item_sys_${c.id}`,
          status: 'SYSTEM_ONLY',
          grade: activeGrade,
          semester: sem,
          neisItem: null,
          systemItem: {
            id: c.id,
            subject: c.subject,
            hours: c.hours,
            category: c.category,
            division: c.division,
            teacher: c.teacher,
            originalTeacher: c.originalTeacher,
            inCurriculum: true,
            inStep1: false
          },
          diffReasons: ['나이스 편성표에 없음 (시수표 전용/자체 개설)'],
          selectedStandard: 'KEEP_SYSTEM' // 시스템 과목은 기존 유지 기본
        });
      });

      window._chmWorkingList = workingList;
      window._chmCurrentFilter = 'all';

      renderChmModal();
      modal.classList.remove('hidden');
    };

    window.closeCurriculumHarmonizeModal = function() {
      const modal = document.getElementById('curriculumHarmonizeModal');
      if (modal) modal.classList.add('hidden');
    };

    // 대조 모달 필터 변경
    window.setChmFilter = function(filterType) {
      window._chmCurrentFilter = filterType;
      const btns = {
        all: document.getElementById('chmFilterBtnAll'),
        diff: document.getElementById('chmFilterBtnDiff'),
        new: document.getElementById('chmFilterBtnNew'),
        systemOnly: document.getElementById('chmFilterBtnSystem')
      };
      Object.keys(btns).forEach(k => {
        const btn = btns[k];
        if (!btn) return;
        if (k === filterType) {
          btn.className = 'px-2.5 py-1 rounded-lg bg-white text-slate-900 shadow-2xs font-extrabold transition';
        } else {
          btn.className = 'px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 font-bold transition';
        }
      });
      renderChmModal();
    };

    // 항목 결정 토글 (나이스 기준 vs 기존 유지)
    window.toggleHarmonizeItemChoice = function(index) {
      const item = window._chmWorkingList[index];
      if (!item) return;

      if (item.status === 'SYSTEM_ONLY') {
        item.selectedStandard = (item.selectedStandard === 'KEEP_SYSTEM') ? 'IGNORE' : 'KEEP_SYSTEM';
      } else if (item.status === 'NEIS_ONLY') {
        item.selectedStandard = (item.selectedStandard === 'NEIS') ? 'IGNORE' : 'NEIS';
      } else {
        item.selectedStandard = (item.selectedStandard === 'NEIS') ? 'KEEP_SYSTEM' : 'NEIS';
      }
      renderChmModal();
    };

    // 전체 나이스 기준으로 일괄 선택
    window.setHarmonizeAllStandard = function() {
      (window._chmWorkingList || []).forEach(item => {
        if (item.status === 'SYSTEM_ONLY') {
          item.selectedStandard = 'KEEP_SYSTEM';
        } else {
          item.selectedStandard = 'NEIS';
        }
      });
      renderChmModal();
    };

    // 대조 모달 테이블 렌더링
    function renderChmModal() {
      const tbody = document.getElementById('chmTableTbody');
      const emptyEl = document.getElementById('chmTableEmpty');
      if (!tbody) return;

      const items = window._chmWorkingList || [];

      // 통계 계산
      const countTotal = items.length;
      const countMatched = items.filter(it => it.status === 'MATCHED').length;
      const countDiff = items.filter(it => it.status === 'DIFF').length;
      const countNew = items.filter(it => it.status === 'NEIS_ONLY').length;
      const countSysOnly = items.filter(it => it.status === 'SYSTEM_ONLY').length;

      const statTotalEl = document.getElementById('chmStatTotal');
      const statMatchedEl = document.getElementById('chmStatMatched');
      const statDiffEl = document.getElementById('chmStatDiff');
      const statNewEl = document.getElementById('chmStatNew');
      const statSysEl = document.getElementById('chmStatSystemOnly');

      if (statTotalEl) statTotalEl.textContent = `총 ${countTotal}과목`;
      if (statMatchedEl) statMatchedEl.textContent = `🟢 일치 ${countMatched}`;
      if (statDiffEl) statDiffEl.textContent = `🟡 미세차이 ${countDiff}`;
      if (statNewEl) statNewEl.textContent = `🔵 신규 ${countNew}`;
      if (statSysEl) statSysEl.textContent = `🔴 시수표 전용 ${countSysOnly}`;

      // 필터 적용
      const filter = window._chmCurrentFilter || 'all';
      const visibleItems = items.filter((it, idx) => {
        it._origIdx = idx;
        if (filter === 'diff') return it.status === 'DIFF';
        if (filter === 'new') return it.status === 'NEIS_ONLY';
        if (filter === 'systemOnly') return it.status === 'SYSTEM_ONLY';
        return true;
      });

      if (visibleItems.length === 0) {
        tbody.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
      }
      if (emptyEl) emptyEl.classList.add('hidden');

      tbody.innerHTML = visibleItems.map(it => {
        const origIdx = it._origIdx;
        const n = it.neisItem;
        const s = it.systemItem;

        // 상태 뱃지
        let statusBadge = '';
        if (it.status === 'MATCHED') {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 일치</span>';
        } else if (it.status === 'DIFF') {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">🟡 차이</span>';
        } else if (it.status === 'NEIS_ONLY') {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">🔵 신규</span>';
        } else {
          statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">🔴 전용</span>';
        }

        // NEIS 컬럼 내용
        let neisContent = '';
        if (n) {
          neisContent = `
            <div class="space-y-0.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-extrabold text-xs sm:text-sm text-slate-900">${chmEscapeHtml(n.subject)}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.2 rounded ${n.type === '학교지정' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}">${n.type}</span>
                ${n.subjectType ? `<span class="text-[10px] px-1 py-0.2 rounded font-medium bg-slate-100 text-slate-600">${n.subjectType}</span>` : ''}
              </div>
              <div class="text-[11px] text-slate-500 flex items-center gap-2">
                <span>시수: <strong class="text-emerald-700 font-bold">${n.hours}시수</strong></span>
                <span>교과(군): ${chmEscapeHtml(n.category)}</span>
              </div>
            </div>
          `;
        } else {
          neisContent = '<span class="text-slate-400 italic text-[11px]">나이스 편성표에 없음</span>';
        }

        // 시스템 컬럼 내용
        let sysContent = '';
        if (s) {
          sysContent = `
            <div class="space-y-0.5">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-extrabold text-xs sm:text-sm text-slate-900">${chmEscapeHtml(s.subject)}</span>
                <span class="text-[10px] font-bold px-1.5 py-0.2 rounded ${s.category === '지정' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}">${s.category || '선택'}</span>
                ${s.division ? `<span class="text-[10px] px-1.5 py-0.2 rounded font-bold bg-indigo-100 text-indigo-700">${s.division}</span>` : ''}
              </div>
              <div class="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                <span>시수: <strong class="text-slate-700 font-bold">${s.hours}시수</strong></span>
                <span>담당 교사: <strong class="text-indigo-700">${s.teacher || '미배정'}</strong></span>
              </div>
            </div>
          `;
        } else {
          sysContent = '<span class="text-blue-500 italic text-[11px] font-bold">미개설 (신규 추가 가능)</span>';
        }

        // 차이 사유 태그
        const diffText = (it.diffReasons && it.diffReasons.length > 0)
          ? `<div class="mt-1 flex flex-wrap gap-1">${it.diffReasons.map(r => `<span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">⚠️ ${chmEscapeHtml(r)}</span>`).join('')}</div>`
          : '';

        // 결정 토글 버튼
        let actionBtn = '';
        if (it.status === 'MATCHED') {
          actionBtn = '<span class="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1"><span>✅</span><span>일치 (완료)</span></span>';
        } else if (it.status === 'SYSTEM_ONLY') {
          const isKeep = (it.selectedStandard === 'KEEP_SYSTEM');
          actionBtn = `
            <button type="button" onclick="window.toggleHarmonizeItemChoice(${origIdx})" class="px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer w-full ${isKeep ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
              <span>${isKeep ? '📌 기존 유지' : '🚫 제외'}</span>
            </button>
          `;
        } else if (it.status === 'NEIS_ONLY') {
          const isAdd = (it.selectedStandard === 'NEIS');
          actionBtn = `
            <button type="button" onclick="window.toggleHarmonizeItemChoice(${origIdx})" class="px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer w-full ${isAdd ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs font-extrabold' : 'bg-slate-100 text-slate-500 border border-slate-200'}">
              <span>${isAdd ? '➕ 나이스 추가' : '추가 안 함'}</span>
            </button>
          `;
        } else {
          // DIFF
          const isNeis = (it.selectedStandard === 'NEIS');
          actionBtn = `
            <button type="button" onclick="window.toggleHarmonizeItemChoice(${origIdx})" class="px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer w-full ${isNeis ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs font-extrabold' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}">
              <span>${isNeis ? '✓ 나이스 기준' : '기존 표기 유지'}</span>
            </button>
          `;
        }

        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-2.5 px-3 text-center align-middle">${statusBadge}</td>
            <td class="py-2.5 px-3 text-center align-middle font-bold text-slate-600">${it.semester}학기</td>
            <td class="py-2.5 px-3 align-middle bg-emerald-50/20 border-r border-slate-200">
              ${neisContent}
            </td>
            <td class="py-2.5 px-3 align-middle border-r border-slate-200">
              ${sysContent}
              ${diffText}
            </td>
            <td class="py-2.5 px-3 text-center align-middle">
              ${actionBtn}
            </td>
          </tr>
        `;
      }).join('');
    }

    // 최종 대조 결과 시스템 전체 반영 (교사·분반·학생선택 100% 보존)
    window.applyCurriculumHarmonization = function() {
      const items = window._chmWorkingList || [];
      if (items.length === 0) {
        window.closeCurriculumHarmonizeModal();
        return;
      }

      const activeGrade = MultiState?.activeGrade || '2학년';
      const activeYear = MultiState?.activeAcademicYear || '2027학년도';
      const numGrade = parseInt(activeGrade.replace(/[^0-9]/g, '') || '2', 10);

      // 1. 과목명 치환 맵 (oldName -> newName) 구성
      const renameMap = {};
      let updatedCount = 0;
      let newAddedCount = 0;

      items.forEach(it => {
        if (it.status === 'DIFF' && it.selectedStandard === 'NEIS' && it.systemItem && it.neisItem) {
          const oldName = it.systemItem.subject;
          const newName = it.neisItem.subject;
          if (oldName !== newName) {
            renameMap[oldName] = newName;
          }
        }
      });

      // 2. 전체 시수종합 (MultiState.curriculumByAcademicYear) 업데이트
      if (!MultiState.curriculumByAcademicYear) MultiState.curriculumByAcademicYear = {};
      if (!Array.isArray(MultiState.curriculumByAcademicYear[activeYear])) {
        MultiState.curriculumByAcademicYear[activeYear] = [];
      }
      const curricList = MultiState.curriculumByAcademicYear[activeYear];

      // 2-1) 기존 시수표 과목명/시수 업데이트 (교사·분반 유지)
      curricList.forEach(c => {
        if (!c) return;
        const cg = String(c.grade || '').trim();
        if (!cg.includes(String(numGrade))) return;

        // 치환 맵 적용
        if (renameMap[c.subject]) {
          c.subject = renameMap[c.subject];
          c.baseSubject = (typeof window.getBaseSubjectName === 'function') ? window.getBaseSubjectName(c.subject) : c.subject;
          c.isModified = true;
          updatedCount++;
        }

        // DIFF 중 시수 일치화 적용
        const matchItem = items.find(it => it.systemItem && it.systemItem.id === c.id);
        if (matchItem && matchItem.selectedStandard === 'NEIS' && matchItem.neisItem) {
          c.hours = Number(matchItem.neisItem.hours);
          c.subject = matchItem.neisItem.subject;
          c.baseSubject = (typeof window.getBaseSubjectName === 'function') ? window.getBaseSubjectName(c.subject) : c.subject;
          c.isModified = true;
          updatedCount++;
        }
      });

      // 2-2) 신규 과목(NEIS_ONLY) 시수표 추가 (선택한 경우)
      items.forEach(it => {
        if (it.status === 'NEIS_ONLY' && it.selectedStandard === 'NEIS' && it.neisItem) {
          const n = it.neisItem;
          const isDesignated = (n.type === '학교지정');

          // 지정과목인 경우 기본 1반 등록 (학급수가 2이면 2반도 함께 등록)
          const classCount = MultiState?.gradeClassCounts?.[activeGrade] || 2;
          if (isDesignated) {
            for (let b = 1; b <= classCount; b++) {
              curricList.push({
                id: 'curr_neis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                grade: activeGrade,
                semester: n.semester,
                category: '지정',
                division: `${b}반`,
                subject: n.subject,
                baseSubject: (typeof window.getBaseSubjectName === 'function') ? window.getBaseSubjectName(n.subject) : n.subject,
                hours: n.hours,
                teacher: '',
                originalTeacher: '',
                status: '개설',
                isModified: true
              });
            }
          } else {
            // 선택과목
            curricList.push({
              id: 'curr_neis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              grade: activeGrade,
              semester: n.semester,
              category: '선택',
              division: '',
              subject: n.subject,
              baseSubject: (typeof window.getBaseSubjectName === 'function') ? window.getBaseSubjectName(n.subject) : n.subject,
              hours: n.hours,
              teacher: '',
              originalTeacher: '',
              status: '개설',
              isModified: true
            });
          }
          newAddedCount++;
        }
      });

      // 3. 1단계 선택과목(sem1Subjects, sem2Subjects) 과목명 일치화 및 신규 선택과목 등록
      ['sem1Subjects', 'sem2Subjects'].forEach((semKey, sIdx) => {
        const sem = sIdx + 1;
        let subjects = Array.isArray(AppState[semKey]) ? [...AppState[semKey]] : [];

        // 치환 적용
        subjects = subjects.map(s => renameMap[s] || s);

        // 신규 선택과목 중 해당 학기 과목 추가
        items.forEach(it => {
          if (it.status === 'NEIS_ONLY' && it.selectedStandard === 'NEIS' && it.semester === sem && it.neisItem && it.neisItem.type === '학생선택') {
            if (!subjects.includes(it.neisItem.subject)) {
              subjects.push(it.neisItem.subject);
            }
          }
        });

        AppState[semKey] = subjects;
      });

      // 4. 학생 수강신청 선택 내역 과목명 치환 (AppState.students)
      if (Array.isArray(AppState.students) && Object.keys(renameMap).length > 0) {
        AppState.students.forEach(st => {
          if (Array.isArray(st.sem1)) {
            st.sem1 = st.sem1.map(s => renameMap[s] || s);
          }
          if (Array.isArray(st.sem2)) {
            st.sem2 = st.sem2.map(s => renameMap[s] || s);
          }
        });
      }

      // 5. 2단계 그룹핑 배치(currentPlans, savedPlans) 과목명 치환
      const updatePlansList = (plans) => {
        if (!Array.isArray(plans)) return;
        plans.forEach(plan => {
          if (!plan || !Array.isArray(plan.groups)) return;
          plan.groups.forEach(g => {
            if (Array.isArray(g.subjects)) {
              g.subjects = g.subjects.map(s => renameMap[s] || s);
            }
          });
        });
      };
      if (AppState.savedPlans) updatePlansList(AppState.savedPlans);
      if (AppState.currentPlans) {
        [1, 2].forEach(sem => {
          if (AppState.currentPlans[sem]) updatePlansList([AppState.currentPlans[sem]]);
        });
      }
      if (AppState.currentPlan) updatePlansList([AppState.currentPlan]);

      // 6. 3단계 교과군 자동 연동 및 공통과목 검증 제외 자동 세팅
      if (typeof getStep3Data === 'function') {
        const sData = getStep3Data();
        if (!sData.excludedSubjects) sData.excludedSubjects = {};

        // 나이스 편성표 과목들 중 '공통' 과목구분은 기본 검증 제외 등록
        items.forEach(it => {
          const n = it.neisItem;
          if (n) {
            const norm = (typeof window.normalizeSubject === 'function') ? window.normalizeSubject(n.subject) : n.subject;
            if (n.isCommon || n.subjectType === '공통') {
              if (sData.excludedSubjects[norm] === undefined) {
                sData.excludedSubjects[norm] = true;
              }
            }
          }
        });
        if (typeof saveStep3Data === 'function') saveStep3Data(sData);
      }

      // 7. 전체 상태 저장 및 화면 리프레시
      if (typeof saveAllState === 'function') saveAllState();
      updateNeisCurriculumCardUI();

      if (typeof renderStep1 === 'function') renderStep1();
      if (typeof renderAllGradesCurriculumTable === 'function') renderAllGradesCurriculumTable();

      window.closeCurriculumHarmonizeModal();

      const renameSummary = Object.keys(renameMap).length > 0
        ? `\n- 과목명 정규화(띄어쓰기 등): ${Object.keys(renameMap).length}건`
        : '';
      const newSummary = newAddedCount > 0
        ? `\n- 신규 과목 편성: ${newAddedCount}건`
        : '';

      alert(`✅ [${activeGrade}] 나이스 교육과정 기준 일치화가 완료되었습니다!${renameSummary}${newSummary}\n(기존 배정 교사, 분반, 학생 선택 내역이 100% 보존되었습니다.)`);
    };

    // ==========================================
    // 나이스 입학생 3개년 교육과정 편성표 '정규화 뷰어' 모달 엔진
    // ==========================================
    window._ncvFilters = { grade: 'all', type: 'all', search: '' };

    window.openNeisCurriculumViewModal = function() {
      const modal = document.getElementById('neisCurriculumViewModal');
      if (!modal) return;

      const activeGrade = MultiState?.activeGrade || '2학년';
      const activeYear = MultiState?.activeAcademicYear || '2027학년도';

      const neisMap = MultiState?.neisCurriculumsByAcademicYear?.[activeYear] || {};
      const neisData = AppState?.neisCurriculum || neisMap[activeGrade];

      if (!neisData || !Array.isArray(neisData.subjects) || neisData.subjects.length === 0) {
        alert(`현재 등록된 나이스 입학생 교육과정 편성표가 없습니다.\n먼저 0번 카드에 엑셀/CSV 파일을 등록해주세요.`);
        return;
      }

      const badgeEl = document.getElementById('ncvModalHeaderBadge');
      if (badgeEl) {
        badgeEl.textContent = `[${activeYear} ${activeGrade} 등록 파일: ${neisData.fileName || '원본'}]`;
      }

      window._ncvFilters = { grade: 'all', type: 'all', search: '' };
      const searchInput = document.getElementById('ncvSearchInput');
      if (searchInput) searchInput.value = '';

      renderNeisCurriculumViewModal();
      modal.classList.remove('hidden');
    };

    window.closeNeisCurriculumViewModal = function() {
      const modal = document.getElementById('neisCurriculumViewModal');
      if (modal) modal.classList.add('hidden');
    };

    window.setNeisViewFilter = function(filterKey, filterVal) {
      if (!window._ncvFilters) window._ncvFilters = { grade: 'all', type: 'all', search: '' };
      window._ncvFilters[filterKey] = filterVal;

      // Grade button styles
      if (filterKey === 'grade') {
        const gradeMap = {
          all: document.getElementById('ncvFilterGradeAll'),
          '1학년': document.getElementById('ncvFilterGrade1'),
          '2학년': document.getElementById('ncvFilterGrade2'),
          '3학년': document.getElementById('ncvFilterGrade3')
        };
        Object.keys(gradeMap).forEach(k => {
          const btn = gradeMap[k];
          if (!btn) return;
          if (k === filterVal) {
            btn.className = 'px-2.5 py-1 rounded-lg bg-white text-slate-900 shadow-2xs font-extrabold transition';
          } else {
            btn.className = 'px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 font-bold transition';
          }
        });
      }

      // Type button styles
      if (filterKey === 'type') {
        const typeMap = {
          all: document.getElementById('ncvFilterTypeAll'),
          '학교지정': document.getElementById('ncvFilterTypeDesig'),
          '학생선택': document.getElementById('ncvFilterTypeElec')
        };
        Object.keys(typeMap).forEach(k => {
          const btn = typeMap[k];
          if (!btn) return;
          if (k === filterVal) {
            btn.className = 'px-2.5 py-1 rounded-lg bg-white text-slate-900 shadow-2xs font-extrabold transition';
          } else {
            btn.className = 'px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 font-bold transition';
          }
        });
      }

      renderNeisCurriculumViewModal();
    };

    function renderNeisCurriculumViewModal() {
      const tbody = document.getElementById('ncvTableTbody');
      const emptyEl = document.getElementById('ncvTableEmpty');
      const footerCount = document.getElementById('ncvFooterCount');
      if (!tbody) return;

      const activeGrade = MultiState?.activeGrade || '2학년';
      const activeYear = MultiState?.activeAcademicYear || '2027학년도';
      const neisMap = MultiState?.neisCurriculumsByAcademicYear?.[activeYear] || {};
      const neisData = AppState?.neisCurriculum || neisMap[activeGrade];

      if (!neisData || !Array.isArray(neisData.subjects)) {
        tbody.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
      }

      const allSubjs = neisData.subjects;

      // Stats
      const countTotal = allSubjs.length;
      const countG1 = allSubjs.filter(s => s.grade === 1).length;
      const countG2 = allSubjs.filter(s => s.grade === 2).length;
      const countG3 = allSubjs.filter(s => s.grade === 3).length;
      const countDesig = allSubjs.filter(s => s.type === '학교지정').length;
      const countElec = allSubjs.filter(s => s.type === '학생선택').length;

      const statTotalEl = document.getElementById('ncvStatTotal');
      const statG1El = document.getElementById('ncvStatG1');
      const statG2El = document.getElementById('ncvStatG2');
      const statG3El = document.getElementById('ncvStatG3');
      const statDesigEl = document.getElementById('ncvStatDesignated');
      const statElecEl = document.getElementById('ncvStatElective');

      if (statTotalEl) statTotalEl.textContent = `총 ${countTotal}과목`;
      if (statG1El) statG1El.textContent = `1학년 ${countG1}`;
      if (statG2El) statG2El.textContent = `2학년 ${countG2}`;
      if (statG3El) statG3El.textContent = `3학년 ${countG3}`;
      if (statDesigEl) statDesigEl.textContent = `학교지정 ${countDesig}`;
      if (statElecEl) statElecEl.textContent = `학생선택 ${countElec}`;

      const f = window._ncvFilters || { grade: 'all', type: 'all', search: '' };

      const filtered = allSubjs.filter(s => {
        if (f.grade !== 'all' && s.gradeStr !== f.grade && `${s.grade}학년` !== f.grade) return false;
        if (f.type !== 'all' && s.type !== f.type) return false;
        if (f.search && f.search.trim()) {
          const q = f.search.trim().toLowerCase();
          const matchSubj = (s.subject || '').toLowerCase().includes(q);
          const matchCat = (s.category || '').toLowerCase().includes(q);
          const matchDom = (s.domain || '').toLowerCase().includes(q);
          const matchSType = (s.subjectType || '').toLowerCase().includes(q);
          const matchGrp = (s.electiveGroupName || '').toLowerCase().includes(q);
          if (!matchSubj && !matchCat && !matchDom && !matchSType && !matchGrp) return false;
        }
        return true;
      });

      if (footerCount) {
        footerCount.textContent = `표시 중: ${filtered.length}과목 (전체 ${countTotal}과목)`;
      }

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
      }
      if (emptyEl) emptyEl.classList.add('hidden');

      tbody.innerHTML = filtered.map((s, idx) => {
        // Badges
        const typeBadge = s.type === '학교지정'
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">학교지정</span>'
          : '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-900 border border-sky-300">학생선택</span>';

        let stBadge = '';
        if (s.subjectType === '공통') {
          stBadge = '<span class="px-1.5 py-0.2 rounded font-black text-[10px] bg-purple-100 text-purple-800 border border-purple-200">공통</span>';
        } else if (s.subjectType === '일반 선택') {
          stBadge = '<span class="px-1.5 py-0.2 rounded font-bold text-[10px] bg-blue-100 text-blue-800 border border-blue-200">일반 선택</span>';
        } else if (s.subjectType === '진로 선택') {
          stBadge = '<span class="px-1.5 py-0.2 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">진로 선택</span>';
        } else if (s.subjectType === '융합 선택') {
          stBadge = '<span class="px-1.5 py-0.2 rounded font-bold text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200">융합 선택</span>';
        } else if (s.subjectType) {
          stBadge = `<span class="px-1.5 py-0.2 rounded font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">${chmEscapeHtml(s.subjectType)}</span>`;
        }

        const noteText = s.electiveGroupName
          ? `<span class="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">${chmEscapeHtml(s.electiveGroupName)}</span>`
          : '<span class="text-slate-300">-</span>';

        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">${idx + 1}</td>
            <td class="py-2 px-3 text-center font-bold text-slate-800">${s.gradeStr || (s.grade + '학년')}</td>
            <td class="py-2 px-3 text-center font-bold text-slate-600">${s.semester}학기</td>
            <td class="py-2 px-3 text-center">${typeBadge}</td>
            <td class="py-2 px-3 text-slate-700 font-medium">${chmEscapeHtml(s.domain || '-')}</td>
            <td class="py-2 px-3 font-bold text-slate-800">${chmEscapeHtml(s.category || '-')}</td>
            <td class="py-2 px-3 text-center">${stBadge}</td>
            <td class="py-2 px-3 font-black text-slate-900 text-xs sm:text-sm">${chmEscapeHtml(s.subject)}</td>
            <td class="py-2 px-3 text-center font-extrabold text-emerald-700 bg-emerald-50/30">${s.hours}</td>
            <td class="py-2 px-3">${noteText}</td>
          </tr>
        `;
      }).join('');
    }
    window.renderNeisCurriculumViewModal = renderNeisCurriculumViewModal;

    // 정규화 완료된 깨끗한 교육과정 편성표 엑셀 다운로드
    window.exportNeisCurriculumCleanExcel = function() {
      const activeGrade = MultiState?.activeGrade || '2학년';
      const activeYear = MultiState?.activeAcademicYear || '2027학년도';
      const neisMap = MultiState?.neisCurriculumsByAcademicYear?.[activeYear] || {};
      const neisData = AppState?.neisCurriculum || neisMap[activeGrade];

      if (!neisData || !Array.isArray(neisData.subjects) || neisData.subjects.length === 0) {
        alert('다운로드할 교육과정 데이터가 없습니다.');
        return;
      }

      if (typeof XLSX === 'undefined') {
        alert('엑셀 라이브러리가 로드되지 않았습니다.');
        return;
      }

      const rows = [
        ['순번', '학년', '학기', '구분', '교과영역', '교과(군)', '과목구분', '과목명', '학점(시수)', '선택과목군/비고']
      ];

      neisData.subjects.forEach((s, idx) => {
        rows.push([
          idx + 1,
          s.gradeStr || `${s.grade}학년`,
          `${s.semester}학기`,
          s.type,
          s.domain || '',
          s.category || '',
          s.subjectType || '',
          s.subject,
          s.hours,
          s.electiveGroupName || ''
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);

      ws['!cols'] = [
        { wch: 6 },  // 순번
        { wch: 8 },  // 학년
        { wch: 8 },  // 학기
        { wch: 10 }, // 구분
        { wch: 12 }, // 교과영역
        { wch: 15 }, // 교과(군)
        { wch: 12 }, // 과목구분
        { wch: 22 }, // 과목명
        { wch: 10 }, // 학점(시수)
        { wch: 30 }  // 비고
      ];

      XLSX.utils.book_append_sheet(wb, ws, '입학생교육과정_정규화');

      const fileName = `${activeYear}_입학생_3개년_교육과정_편성표_정규화완료.xlsx`;
      if (typeof window.saveExcelFile === 'function') {
        window.saveExcelFile(wb, fileName);
      } else {
        XLSX.writeFile(wb, fileName);
      }
    };

    // ==========================================