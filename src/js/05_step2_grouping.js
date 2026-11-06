    // 4. STEP 2: GROUPING / OPTIMIZATION ENGINE
    // ==========================================

    function updateStep2SemesterTabs(sem) {
      const activeCls = 'px-5 py-2.5 sm:px-6 sm:py-2.5 text-sm sm:text-base font-black rounded-lg bg-blue-600 text-white shadow-md ring-2 ring-blue-300 transition-all cursor-pointer flex items-center gap-2';
      const inactiveCls = 'px-5 py-2.5 sm:px-6 sm:py-2.5 text-sm sm:text-base font-bold rounded-lg text-slate-600 hover:text-blue-700 hover:bg-white/80 transition-all cursor-pointer flex items-center gap-2';
      if (step2Sem1Btn && step2Sem2Btn) {
        if (sem === 1) {
          step2Sem1Btn.className = activeCls;
          step2Sem2Btn.className = inactiveCls;
        } else {
          step2Sem2Btn.className = activeCls;
          step2Sem1Btn.className = inactiveCls;
        }
      }
    }

    step2Sem1Btn?.addEventListener('click', () => {
      switchSemester(1);
    });

    step2Sem2Btn?.addEventListener('click', () => {
      switchSemester(2);
    });

    btnRegroup.addEventListener('click', () => {
      runOptimization();
    });

    function initStep2Controls() {
      const sem = AppState.currentSemester;
      updateStep2SemesterTabs(sem);

      const rawSubjects = sem === 1 ? AppState.sem1Subjects : AppState.sem2Subjects;
      const closedList = AppState.closedSubjects?.[sem] || [];
      const subjects = rawSubjects.filter(s => !closedList.includes(s));
      const groupCount = sem === 1 ? AppState.sem1GroupCount : AppState.sem2GroupCount;

      const closedNote = closedList.length > 0 ? ` (폐강 확정 ${closedList.length}과목 제외)` : '';
      document.getElementById('groupCountInfo').textContent = `(총 ${groupCount}개 그룹 편성${closedNote})`;
      statGroupCountDisplay.textContent = `${groupCount}그룹`;

      // 1. Split Subjects List
      let splitHtml = '';
      subjects.forEach(s => {
        const isChecked = !!AppState.splitSubjects[sem][s];
        splitHtml += `
          <label class="flex items-center space-x-2 text-xs text-slate-700 p-1 hover:bg-slate-200/60 rounded cursor-pointer">
            <input type="checkbox" class="split-checkbox rounded text-blue-600 focus:ring-blue-500" data-subject="${s}" ${isChecked ? 'checked' : ''}>
            <span class="truncate">${s}</span>
          </label>
        `;
      });
      splitSubjectsContainer.innerHTML = splitHtml;

      splitSubjectsContainer.querySelectorAll('.split-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const subj = e.target.getAttribute('data-subject');
          if (e.target.checked) {
            AppState.splitSubjects[sem][subj] = 2; // Default 2 split classes
          } else {
            delete AppState.splitSubjects[sem][subj];
          }
          runOptimization();
          saveAllState();
        });
      });

      // 2. Together & Separate Pair Dropdowns
      const together1 = document.getElementById('togetherSubj1Select');
      const together2 = document.getElementById('togetherSubj2Select');
      const separate1 = document.getElementById('separateSubj1Select');
      const separate2 = document.getElementById('separateSubj2Select');

      const subjOptions = subjects.map(s => `<option value="${s}">${s}</option>`).join('');
      if (together1) together1.innerHTML = subjOptions;
      if (together2) {
        together2.innerHTML = subjOptions;
        if (subjects.length > 1) together2.selectedIndex = 1;
      }
      if (separate1) separate1.innerHTML = subjOptions;
      if (separate2) {
        separate2.innerHTML = subjOptions;
        if (subjects.length > 1) separate2.selectedIndex = 1;
      }

      renderTogetherPairsList();
      renderSeparatePairsList();

      // 4. Target Conflict Range Sync
      if (!AppState.targetConflictN) {
        AppState.targetConflictN = { 1: null, 2: null };
      }
      const currentTarget = AppState.targetConflictN[sem];
      let minVal = '', maxVal = '';
      if (currentTarget) {
        if (typeof currentTarget === 'number') {
          minVal = currentTarget;
          maxVal = currentTarget;
        } else if (currentTarget.min !== undefined && currentTarget.max !== undefined) {
          minVal = currentTarget.min;
          maxVal = currentTarget.max;
        }
      }
      if (targetConflictMinInput) targetConflictMinInput.value = minVal;
      if (targetConflictMaxInput) targetConflictMaxInput.value = maxVal;
      if (targetConflictMinInput2) targetConflictMinInput2.value = minVal;
      if (targetConflictMaxInput2) targetConflictMaxInput2.value = maxVal;

      savedPlansActiveTab = sem;
      renderSavedPlansList();

      initCrossConditionControls();
      renderCrossConditionsList();
      updateStep2ContextMemoUI();
    }

    // Target Conflict Range Event Listeners (Top & Timetable Toolbar)
    targetConflictMinInput?.addEventListener('input', () => {
      if (targetConflictMinInput2) targetConflictMinInput2.value = targetConflictMinInput.value;
    });
    targetConflictMaxInput?.addEventListener('input', () => {
      if (targetConflictMaxInput2) targetConflictMaxInput2.value = targetConflictMaxInput.value;
    });

    targetConflictMinInput2?.addEventListener('input', () => {
      if (targetConflictMinInput) targetConflictMinInput.value = targetConflictMinInput2.value;
    });
    targetConflictMaxInput2?.addEventListener('input', () => {
      if (targetConflictMaxInput) targetConflictMaxInput.value = targetConflictMaxInput2.value;
    });

    [targetConflictMinInput, targetConflictMaxInput, targetConflictMinInput2, targetConflictMaxInput2].forEach(inp => {
      inp?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          inp.blur();
          btnApplyTargetN?.click();
        }
      });
    });

    btnApplyTargetN?.addEventListener('click', () => {
      const sem = AppState.currentSemester;
      const minRaw = targetConflictMinInput ? targetConflictMinInput.value.trim() : '';
      const maxRaw = targetConflictMaxInput ? targetConflictMaxInput.value.trim() : '';
      if (!AppState.targetConflictN) AppState.targetConflictN = { 1: null, 2: null };

      if (minRaw === '' && maxRaw === '') {
        AppState.targetConflictN[sem] = null;
        if (targetConflictMinInput) targetConflictMinInput.value = '';
        if (targetConflictMaxInput) targetConflictMaxInput.value = '';
        if (targetConflictMinInput2) targetConflictMinInput2.value = '';
        if (targetConflictMaxInput2) targetConflictMaxInput2.value = '';
      } else {
        let minN = minRaw !== '' ? Math.max(0, parseInt(minRaw, 10) || 0) : 0;
        let maxN = maxRaw !== '' ? Math.max(0, parseInt(maxRaw, 10) || 0) : minN;
        if (minN > maxN) [minN, maxN] = [maxN, minN];

        if (targetConflictMinInput) targetConflictMinInput.value = minN;
        if (targetConflictMaxInput) targetConflictMaxInput.value = maxN;
        if (targetConflictMinInput2) targetConflictMinInput2.value = minN;
        if (targetConflictMaxInput2) targetConflictMaxInput2.value = maxN;

        AppState.targetConflictN[sem] = { min: minN, max: maxN };
      }
      saveAllState();
      runOptimization();
    });

    btnApplyTargetN2?.addEventListener('click', () => {
      if (targetConflictMinInput && targetConflictMinInput2) targetConflictMinInput.value = targetConflictMinInput2.value;
      if (targetConflictMaxInput && targetConflictMaxInput2) targetConflictMaxInput2.value = targetConflictMaxInput2.value;
      btnApplyTargetN?.click();
    });

    btnResetConflictTarget?.addEventListener('click', () => {
      const sem = AppState.currentSemester;
      if (!AppState.targetConflictN) AppState.targetConflictN = { 1: null, 2: null };
      AppState.targetConflictN[sem] = null;
      if (targetConflictMinInput) targetConflictMinInput.value = '';
      if (targetConflictMaxInput) targetConflictMaxInput.value = '';
      if (targetConflictMinInput2) targetConflictMinInput2.value = '';
      if (targetConflictMaxInput2) targetConflictMaxInput2.value = '';
      saveAllState();
      runOptimization();
    });

    btnResetConflictTarget2?.addEventListener('click', () => {
      btnResetConflictTarget?.click();
    });

    // Replicated Timetable Toolbar Action Buttons
    btnRegroup2?.addEventListener('click', () => {
      btnRegroup?.click();
    });

    btnSavePlan2?.addEventListener('click', () => {
      if (typeof saveCurrentWorkMemo === 'function') saveCurrentWorkMemo();
      btnSavePlan?.click();
    });

    btnExportAllPlans2?.addEventListener('click', () => {
      btnExportAllPlans?.click();
    });

    btnRestoreBestPlan?.addEventListener('click', () => {
      const sem = AppState.currentSemester;
      const history = AppState.simulationHistory?.[sem];
      if (history && history.minConflictPlan) {
        AppState.currentPlan = JSON.parse(JSON.stringify(history.minConflictPlan));
        if (!AppState.currentPlans) AppState.currentPlans = { 1: null, 2: null };
        AppState.currentPlans[sem] = AppState.currentPlan;
        renderStep2Results();
        saveAllState();
        alert(`🏆 역대 최저 충돌(${history.minConflictEver}명) 조합 안으로 복원되었습니다.`);
      }
    });

    // ----------------------------------------------------
    // CROSS-SEMESTER CONDITION STUDENT EXTRACTION
    // ----------------------------------------------------
    function initCrossConditionControls() {
      const s1Select = document.getElementById('crossCondSem1Subj');
      const s2Select = document.getElementById('crossCondSem2Subj');
      if (!s1Select || !s2Select) return;

      const sem1Subjs = AppState.sem1Subjects || [];
      const sem2Subjs = AppState.sem2Subjects || [];

      const curS1 = s1Select.value;
      const curS2 = s2Select.value;

      s1Select.innerHTML = sem1Subjs.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
      s2Select.innerHTML = sem2Subjs.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');

      if (curS1 && sem1Subjs.includes(curS1)) {
        s1Select.value = curS1;
      }
      if (curS2 && sem2Subjs.includes(curS2)) {
        s2Select.value = curS2;
      }
    }

    function getMatchingStudentsForCondition(rule) {
      if (!rule || !AppState.students) return [];
      const { sem1Subject, sem1Type, sem2Subject, sem2Type } = rule;

      return AppState.students.filter(st => {
        const s1List = st.sem1 || [];
        const s2List = st.sem2 || [];
        const norm1 = normalizeSubject(sem1Subject);
        const norm2 = normalizeSubject(sem2Subject);
        const has1 = s1List.some(s => normalizeSubject(s) === norm1);
        const has2 = s2List.some(s => normalizeSubject(s) === norm2);

        const match1 = (sem1Type === 'take') ? has1 : !has1;
        const match2 = (sem2Type === 'take') ? has2 : !has2;

        return match1 && match2;
      }).sort((a, b) => {
        const cA = parseInt(a.classNum, 10) || 0;
        const cB = parseInt(b.classNum, 10) || 0;
        if (cA !== cB) return cA - cB;
        const nA = parseInt(a.studentNum, 10) || 0;
        const nB = parseInt(b.studentNum, 10) || 0;
        return nA - nB;
      });
    }

    function renderCrossConditionsList() {
      const container = document.getElementById('crossConditionsList');
      if (!container) return;

      if (!AppState.crossSemesterRules) AppState.crossSemesterRules = [];
      if (!AppState.step2Memos) AppState.step2Memos = { 1: '', 2: '' };
      const rules = AppState.crossSemesterRules;

      if (rules.length === 0) {
        container.innerHTML = `<p class="text-[11px] text-slate-400 text-center py-2">등록된 조건이 없습니다.</p>`;
        return;
      }

      container.innerHTML = rules.map(r => {
        const matches = getMatchingStudentsForCondition(r);
        const count = matches.length;
        const s1Badge = r.sem1Type === 'take' 
          ? '<span class="text-blue-600 font-extrabold">수강</span>' 
          : '<span class="text-rose-600 font-extrabold">미수강</span>';
        const s2Badge = r.sem2Type === 'take' 
          ? '<span class="text-blue-600 font-extrabold">수강</span>' 
          : '<span class="text-rose-600 font-extrabold">미수강</span>';

        return `
          <div class="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-indigo-300 transition gap-1 group">
            <button type="button" 
                    onclick="window.openCrossConditionModal('${r.id}')"
                    class="flex items-center justify-between flex-1 min-w-0 text-left cursor-pointer hover:bg-slate-50 p-0.5 rounded transition"
                    title="클릭하여 해당 학생 명단 확인">
              <span class="text-[11px] text-slate-700 truncate mr-1">
                1학기 ${escapeHtml(r.sem1Subject)}(${s1Badge}) &amp; 2학기 ${escapeHtml(r.sem2Subject)}(${s2Badge})
              </span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full font-black shrink-0 ${count > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-400'}">
                ${count}명
              </span>
            </button>
            <button type="button" 
                    onclick="window.deleteCrossConditionRule('${r.id}')"
                    class="text-slate-300 hover:text-rose-600 px-1 text-xs font-bold transition shrink-0 cursor-pointer"
                    title="조건 삭제">
              ✕
            </button>
          </div>
        `;
      }).join('');
    }

    document.getElementById('btnAddCrossCondition')?.addEventListener('click', () => {
      const s1Select = document.getElementById('crossCondSem1Subj');
      const s1TypeSelect = document.getElementById('crossCondSem1Type');
      const s2Select = document.getElementById('crossCondSem2Subj');
      const s2TypeSelect = document.getElementById('crossCondSem2Type');

      if (!s1Select || !s2Select) return;
      const sem1Subj = s1Select.value;
      const sem1Type = s1TypeSelect ? s1TypeSelect.value : 'take';
      const sem2Subj = s2Select.value;
      const sem2Type = s2TypeSelect ? s2TypeSelect.value : 'take';

      if (!sem1Subj || !sem2Subj) {
        alert('1학기 및 2학기 과목을 선택해주세요.');
        return;
      }

      if (!AppState.crossSemesterRules) AppState.crossSemesterRules = [];

      const exists = AppState.crossSemesterRules.some(r => 
        r.sem1Subject === sem1Subj && r.sem1Type === sem1Type &&
        r.sem2Subject === sem2Subj && r.sem2Type === sem2Type
      );
      if (exists) {
        alert('이미 동일한 조건이 등록되어 있습니다.');
        return;
      }

      const newRule = {
        id: 'csr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        sem1Subject: sem1Subj,
        sem1Type: sem1Type,
        sem2Subject: sem2Subj,
        sem2Type: sem2Type
      };

      AppState.crossSemesterRules.push(newRule);
      renderCrossConditionsList();
      saveAllState();

      const matched = getMatchingStudentsForCondition(newRule);
      if (matched.length > 0) {
        window.openCrossConditionModal(newRule.id);
      }
    });

    window.deleteCrossConditionRule = function(ruleId) {
      if (!AppState.crossSemesterRules) return;
      AppState.crossSemesterRules = AppState.crossSemesterRules.filter(r => r.id !== ruleId);
      renderCrossConditionsList();
      saveAllState();
    };

    let currentViewingCrossConditionRule = null;

    window.openCrossConditionModal = function(ruleId) {
      if (!AppState.crossSemesterRules) return;
      const rule = AppState.crossSemesterRules.find(r => r.id === ruleId);
      if (!rule) return;

      currentViewingCrossConditionRule = rule;
      const modal = document.getElementById('crossConditionStudentsModal');
      const summaryElem = document.getElementById('crossConditionRuleSummary');
      const countBadge = document.getElementById('crossConditionCountBadge');
      const tbody = document.getElementById('crossConditionStudentsTableBody');

      const matchedStudents = getMatchingStudentsForCondition(rule);

      const s1Text = `1학기 [${rule.sem1Subject}] ${rule.sem1Type === 'take' ? '수강' : '미수강'}`;
      const s2Text = `2학기 [${rule.sem2Subject}] ${rule.sem2Type === 'take' ? '수강' : '미수강'}`;
      if (summaryElem) {
        summaryElem.innerHTML = `<span class="text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold">${escapeHtml(s1Text)}</span> <span class="text-slate-400 font-black">&amp;</span> <span class="text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold">${escapeHtml(s2Text)}</span>`;
      }
      if (countBadge) {
        countBadge.textContent = `총 ${matchedStudents.length}명`;
      }

      if (tbody) {
        if (matchedStudents.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" class="p-8 text-center text-slate-400 font-medium">
                해당 조건(${escapeHtml(s1Text)} &amp; ${escapeHtml(s2Text)})을 만족하는 학생이 없습니다.
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = matchedStudents.map(st => {
            const s1List = (st.sem1 || []).map(s => {
              const isTarget = (s === rule.sem1Subject);
              return isTarget 
                ? `<span class="inline-block bg-blue-100 text-blue-900 font-black px-1.5 py-0.5 rounded border border-blue-300 shadow-2xs">${escapeHtml(s)}</span>`
                : `<span class="inline-block bg-slate-100 text-slate-700 px-1 py-0.5 rounded">${escapeHtml(s)}</span>`;
            }).join(' ');

            const s2List = (st.sem2 || []).map(s => {
              const isTarget = (s === rule.sem2Subject);
              return isTarget 
                ? `<span class="inline-block bg-purple-100 text-purple-900 font-black px-1.5 py-0.5 rounded border border-purple-300 shadow-2xs">${escapeHtml(s)}</span>`
                : `<span class="inline-block bg-slate-100 text-slate-700 px-1 py-0.5 rounded">${escapeHtml(s)}</span>`;
            }).join(' ');

            return `
              <tr class="hover:bg-indigo-50/40 transition">
                <td class="p-2.5 text-center font-semibold text-slate-600">${st.classNum}반</td>
                <td class="p-2.5 text-center font-semibold text-slate-600">${st.studentNum}번</td>
                <td class="p-2.5 text-center font-black text-slate-900 whitespace-nowrap">${escapeHtml(st.name)}</td>
                <td class="p-2.5 text-center text-slate-500 whitespace-nowrap">${escapeHtml(st.career || '-')}</td>
                <td class="p-2.5 space-x-1">${s1List || '<span class="text-slate-300">없음</span>'}</td>
                <td class="p-2.5 space-x-1">${s2List || '<span class="text-slate-300">없음</span>'}</td>
              </tr>
            `;
          }).join('');
        }
      }

      if (modal) modal.classList.remove('hidden');
    };

    window.closeCrossConditionModal = function() {
      const modal = document.getElementById('crossConditionStudentsModal');
      if (modal) modal.classList.add('hidden');
      currentViewingCrossConditionRule = null;
    };

    document.getElementById('btnExportCrossConditionExcel')?.addEventListener('click', () => {
      if (!currentViewingCrossConditionRule) return;
      const rule = currentViewingCrossConditionRule;
      const matched = getMatchingStudentsForCondition(rule);
      if (matched.length === 0) {
        alert('다운로드할 대상 학생이 없습니다.');
        return;
      }

      const rows = [
        ['반', '번호', '이름', '진로희망', '1학기 수강 과목', '2학기 수강 과목']
      ];

      matched.forEach(st => {
        rows.push([
          String(st.classNum) + '반',
          Number(st.studentNum),
          st.name,
          st.career || '',
          (st.sem1 || []).join(', '),
          (st.sem2 || []).join(', ')
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);

      ws['!cols'] = [
        { wch: 8 },
        { wch: 8 },
        { wch: 12 },
        { wch: 18 },
        { wch: 35 },
        { wch: 35 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, '조건별학생명단');

      const s1Clean = rule.sem1Subject.replace(/[\\/:*?"<>|]/g, '');
      const s2Clean = rule.sem2Subject.replace(/[\\/:*?"<>|]/g, '');
      const s1TypeStr = rule.sem1Type === 'take' ? '수강' : '미수강';
      const s2TypeStr = rule.sem2Type === 'take' ? '수강' : '미수강';
      const acadY = MultiState.activeAcademicYear || '2027학년도';
      const grade = MultiState.activeGrade || '2학년';

      const fileName = `[${acadY}_${grade}]_조건별학생_1학기_${s1Clean}_${s1TypeStr}_2학기_${s2Clean}_${s2TypeStr}_(${matched.length}명).xlsx`;

      if (typeof window.saveExcelFile === 'function') {
        window.saveExcelFile(wb, fileName);
      } else {
        XLSX.writeFile(wb, fileName);
      }
    });


    // ----------------------------------------------------
    // TOGETHER & SEPARATE PAIRS RULE MANAGEMENT
    // ----------------------------------------------------
    function renderTogetherPairsList() {
      const sem = AppState.currentSemester;
      if (!AppState.togetherPairs) AppState.togetherPairs = { 1: [], 2: [] };
      if (!AppState.togetherPairs[sem]) AppState.togetherPairs[sem] = [];
      const list = AppState.togetherPairs[sem];
      const container = document.getElementById('togetherPairsList');
      if (!container) return;

      if (list.length === 0) {
        container.innerHTML = '<p class="text-[11px] text-slate-400 italic py-1 text-center">설정된 묶음 규칙 없음</p>';
        return;
      }

      container.innerHTML = list.map((p, idx) => `
        <div class="flex items-center justify-between bg-blue-50/90 border border-blue-200 rounded px-2 py-0.5 text-[11px] text-blue-950 shadow-2xs">
          <div class="flex items-center gap-1 min-w-0 truncate">
            <span class="font-bold truncate" title="${p[0]}">${p[0]}</span>
            <span class="text-blue-500 font-black shrink-0">🔗</span>
            <span class="font-bold truncate" title="${p[1]}">${p[1]}</span>
          </div>
          <button type="button" onclick="window.removeTogetherPair(${idx});" class="text-slate-400 hover:text-rose-600 font-black px-1 text-xs transition shrink-0 ml-1 cursor-pointer" title="규칙 삭제">✕</button>
        </div>
      `).join('');
    }

    function renderSeparatePairsList() {
      const sem = AppState.currentSemester;
      if (!AppState.separatePairs) AppState.separatePairs = { 1: [], 2: [] };
      if (!AppState.separatePairs[sem]) AppState.separatePairs[sem] = [];
      const list = AppState.separatePairs[sem];
      const container = document.getElementById('separatePairsList');
      if (!container) return;

      if (list.length === 0) {
        container.innerHTML = '<p class="text-[11px] text-slate-400 italic py-1 text-center">설정된 분리 규칙 없음</p>';
        return;
      }

      container.innerHTML = list.map((p, idx) => `
        <div class="flex items-center justify-between bg-rose-50/90 border border-rose-200 rounded px-2 py-0.5 text-[11px] text-rose-950 shadow-2xs">
          <div class="flex items-center gap-1 min-w-0 truncate">
            <span class="font-bold truncate" title="${p[0]}">${p[0]}</span>
            <span class="text-rose-500 font-black shrink-0">≠</span>
            <span class="font-bold truncate" title="${p[1]}">${p[1]}</span>
          </div>
          <button type="button" onclick="window.removeSeparatePair(${idx});" class="text-slate-400 hover:text-rose-600 font-black px-1 text-xs transition shrink-0 ml-1 cursor-pointer" title="규칙 삭제">✕</button>
        </div>
      `).join('');
    }

    window.removeTogetherPair = function(idx) {
      const sem = AppState.currentSemester;
      if (AppState.togetherPairs?.[sem]) {
        AppState.togetherPairs[sem].splice(idx, 1);
        renderTogetherPairsList();
        saveAllState();
      }
    };

    window.removeSeparatePair = function(idx) {
      const sem = AppState.currentSemester;
      if (AppState.separatePairs?.[sem]) {
        AppState.separatePairs[sem].splice(idx, 1);
        renderSeparatePairsList();
        saveAllState();
      }
    };

    document.getElementById('btnAddTogetherPair')?.addEventListener('click', () => {
      const sem = AppState.currentSemester;
      const s1 = document.getElementById('togetherSubj1Select')?.value;
      const s2 = document.getElementById('togetherSubj2Select')?.value;
      if (!s1 || !s2) return;
      if (s1 === s2) {
        alert('동일한 과목은 함께 묶을 수 없습니다. 서로 다른 두 과목을 선택해주세요.');
        return;
      }

      if (!AppState.togetherPairs) AppState.togetherPairs = { 1: [], 2: [] };
      if (!AppState.togetherPairs[sem]) AppState.togetherPairs[sem] = [];
      const list = AppState.togetherPairs[sem];

      // Check if already in together list
      const exists = list.some(p => (p[0] === s1 && p[1] === s2) || (p[0] === s2 && p[1] === s1));
      if (exists) {
        alert(`[${s1}] 와 [${s2}] 과목은 이미 '함께 묶을 과목'으로 등록되어 있습니다.`);
        return;
      }

      // Check if conflicting with separate list
      const sepList = AppState.separatePairs?.[sem] || [];
      const conflicts = sepList.some(p => (p[0] === s1 && p[1] === s2) || (p[0] === s2 && p[1] === s1));
      if (conflicts) {
        alert(`⚠️ 상충 규칙 오류:\n[${s1}] 과(와) [${s2}] 은(는) 이미 '함께 묶지 않을 과목'에 등록되어 있습니다.\n해당 분리 규칙을 먼저 삭제한 후 추가해주세요.`);
        return;
      }

      list.push([s1, s2]);
      renderTogetherPairsList();
      saveAllState();
    });

    document.getElementById('btnAddSeparatePair')?.addEventListener('click', () => {
      const sem = AppState.currentSemester;
      const s1 = document.getElementById('separateSubj1Select')?.value;
      const s2 = document.getElementById('separateSubj2Select')?.value;
      if (!s1 || !s2) return;
      if (s1 === s2) {
        alert('동일한 과목은 선택할 수 없습니다. 서로 다른 두 과목을 선택해주세요.');
        return;
      }

      if (!AppState.separatePairs) AppState.separatePairs = { 1: [], 2: [] };
      if (!AppState.separatePairs[sem]) AppState.separatePairs[sem] = [];
      const list = AppState.separatePairs[sem];

      // Check if already in separate list
      const exists = list.some(p => (p[0] === s1 && p[1] === s2) || (p[0] === s2 && p[1] === s1));
      if (exists) {
        alert(`[${s1}] 와 [${s2}] 과목은 이미 '함께 묶지 않을 과목'으로 등록되어 있습니다.`);
        return;
      }

      // Check if conflicting with together list
      const togList = AppState.togetherPairs?.[sem] || [];
      const conflicts = togList.some(p => (p[0] === s1 && p[1] === s2) || (p[0] === s2 && p[1] === s1));
      if (conflicts) {
        alert(`⚠️ 상충 규칙 오류:\n[${s1}] 과(와) [${s2}] 은(는) 이미 '함께 묶을 과목'에 등록되어 있습니다.\n해당 묶음 규칙을 먼저 삭제한 후 추가해주세요.`);
        return;
      }

      list.push([s1, s2]);
      renderSeparatePairsList();
      saveAllState();
    });

    // ==========================================
    // 5. CORE OPTIMIZATION ALGORITHM (UNBIASED & FAST BIPARTITE MATCHING)
    // ==========================================

    // 1) Mathematically Unbiased Fisher-Yates Shuffle
    function shuffleArray(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
      }
      return arr;
    }

    // 2) Fast candidate conflict evaluation for optimizer loop
    function evaluateCandidateConflicts(groups, studentsChoices, studentPinsForSem) {
      const m = groups.length;
      let totalConflicts = 0;
      let conflictedStudentCount = 0;

      for (let sIdx = 0; sIdx < studentsChoices.length; sIdx++) {
        const st = studentsChoices[sIdx];
        const choices = st.choicesList;
        const n = choices.length;
        if (n === 0) continue;

        const relevantPins = studentPinsForSem.filter(p => p.studentId === st.id);
        let pinPenalty = 0;
        relevantPins.forEach(pin => {
          const gTokens = groups[pin.group - 1] || [];
          const normPinSubj = normalizeSubject(pin.subject);
          if (!gTokens.some(t => normalizeSubject(t.parent) === normPinSubj)) {
            pinPenalty += 20;
          }
        });

        // Bipartite matching: choices -> groups
        const adj = [];
        for (let i = 0; i < n; i++) {
          adj[i] = [];
          const parentSubj = choices[i];
          const normParent = normalizeSubject(parentSubj);
          for (let g = 0; g < m; g++) {
            const specificPin = relevantPins.find(p => normalizeSubject(p.subject) === normParent);
            if (specificPin && (g + 1) !== specificPin.group) continue;

            if (groups[g].some(t => normalizeSubject(t.parent) === normParent)) {
              adj[i].push(g);
            }
          }
        }

        const match = Array(m).fill(-1);
        function dfs(u, visited) {
          for (const v of adj[u]) {
            if (!visited[v]) {
              visited[v] = true;
              if (match[v] < 0 || dfs(match[v], visited)) {
                match[v] = u;
                return true;
              }
            }
          }
          return false;
        }

        let matchCount = 0;
        for (let u = 0; u < n; u++) {
          const visited = Array(m).fill(false);
          if (dfs(u, visited)) matchCount++;
        }

        const unassigned = n - matchCount;
        if (unassigned > 0 || pinPenalty > 0) {
          totalConflicts += unassigned + pinPenalty;
          conflictedStudentCount++;
        }
      }

      return { totalConflicts, conflictedStudentCount };
    }

    // 3) Global Multi-start Randomized Search & Range-Targeted Exploration
    function runOptimization() {
      isConflictTableExpanded = false;
      const sem = AppState.currentSemester;
      const rawSubjects = sem === 1 ? AppState.sem1Subjects : AppState.sem2Subjects;
      const closedList = AppState.closedSubjects?.[sem] || [];
      const subjects = rawSubjects.filter(s => !closedList.includes(s));
      const groupCount = sem === 1 ? AppState.sem1GroupCount : AppState.sem2GroupCount;
      const splitConfig = AppState.splitSubjects[sem] || {};
      const pinnedConfig = AppState.pinnedSubjects[sem] || {};
      const studentPinsForSem = (AppState.studentPins || []).filter(p => p.semester === sem);
      const togetherPairs = (AppState.togetherPairs?.[sem] || []).filter(p => subjects.includes(p[0]) && subjects.includes(p[1]));
      const separatePairs = (AppState.separatePairs?.[sem] || []).filter(p => subjects.includes(p[0]) && subjects.includes(p[1]));
      const lockedConfig = AppState.lockedGroups?.[sem] || {};
      const lockedGroupIndices = new Set();
      Object.keys(lockedConfig).forEach(k => {
        if (lockedConfig[k]) lockedGroupIndices.add(parseInt(k, 10));
      });

      if (!subjects || subjects.length === 0 || groupCount <= 0) return;

      // Ensure state objects exist
      if (!AppState.targetConflictN) AppState.targetConflictN = { 1: null, 2: null };
      if (AppState.targetConflictN[sem] === undefined) AppState.targetConflictN[sem] = null;
      if (!AppState.simulationHistory) AppState.simulationHistory = { 1: { runCount: 0, minConflictEver: null, minConflictPlan: null }, 2: { runCount: 0, minConflictEver: null, minConflictPlan: null } };
      if (!AppState.simulationHistory[sem]) AppState.simulationHistory[sem] = { runCount: 0, minConflictEver: null, minConflictPlan: null };

      // Parse user's target conflict range
      let targetRange = null;
      const minRaw = targetConflictMinInput ? targetConflictMinInput.value.trim() : '';
      const maxRaw = targetConflictMaxInput ? targetConflictMaxInput.value.trim() : '';

      if (minRaw !== '' || maxRaw !== '') {
        let minN = minRaw !== '' ? Math.max(0, parseInt(minRaw, 10) || 0) : 0;
        let maxN = maxRaw !== '' ? Math.max(0, parseInt(maxRaw, 10) || 0) : minN;
        if (minN > maxN) [minN, maxN] = [maxN, minN];
        targetRange = { min: minN, max: maxN };
        AppState.targetConflictN[sem] = targetRange;
      } else if (AppState.targetConflictN && AppState.targetConflictN[sem]) {
        const stored = AppState.targetConflictN[sem];
        if (typeof stored === 'number') {
          targetRange = { min: stored, max: stored };
        } else if (stored.min !== undefined && stored.max !== undefined) {
          targetRange = { min: stored.min, max: stored.max };
        }
      } else {
        AppState.targetConflictN[sem] = null;
      }

      const isTargetMode = (targetRange !== null);

      // 그 범위 내에서 랜덤하게 목표 인원(randomTargetN)이 정해지도록 설정 (최소값 편향 방지)
      let randomTargetN = null;
      if (isTargetMode) {
        randomTargetN = Math.floor(Math.random() * (targetRange.max - targetRange.min + 1)) + targetRange.min;
      }

      // Expand subject tokens (handling splits: Japanese-A, Japanese-B)
      const subjectTokens = [];
      subjects.forEach(s => {
        if (splitConfig[s]) {
          for (let i = 0; i < splitConfig[s]; i++) {
            const letter = String.fromCharCode(65 + i); // A, B, C
            subjectTokens.push({ name: `${s}-${letter}`, parent: s, isSplit: true });
          }
        } else {
          subjectTokens.push({ name: s, parent: s, isSplit: false });
        }
      });

      // Prepare student choices representation (excluding closed subjects)
      const studentsChoices = AppState.students.map(st => {
        const rawChoices = (sem === 1 ? st.sem1 : st.sem2).filter(s => !closedList.includes(s));
        return {
          id: st.id,
          classNum: st.classNum,
          studentNum: st.studentNum,
          name: st.name,
          choices: new Set(rawChoices),
          choicesList: rawChoices || []
        };
      });

      // Precompute Co-occurrence Matrix for ultra-fast O(1) overlap lookup
      const coOccurrence = {};
      subjects.forEach(s1 => {
        coOccurrence[s1] = {};
        subjects.forEach(s2 => {
          coOccurrence[s1][s2] = 0;
        });
      });

      studentsChoices.forEach(sc => {
        const arr = sc.choicesList;
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            const a = arr[i];
            const b = arr[j];
            if (coOccurrence[a] && coOccurrence[a][b] !== undefined) coOccurrence[a][b]++;
            if (coOccurrence[b] && coOccurrence[b][a] !== undefined) coOccurrence[b][a]++;
          }
        }
      });

      // Multi-start search with unbiased Fisher-Yates shuffle
      let globalBestGroups = null;
      let globalBestConflicts = 999999;
      let globalBestStudentConflicts = 999999;

      // Candidate solutions that fall within [min, max] range (grouped by conflict count for unbiased selection)
      const candidatesByCount = {}; // count -> array of candidate objects
      const allRangeCandidates = [];
      const seenSignatures = new Set();
      let closestCandidate = null;
      let closestDiff = 999999;

      const iterations = 1200; // Thorough unbiased exploration

      for (let iter = 0; iter < iterations; iter++) {
        const currentGroups = Array.from({ length: groupCount }, () => []);
        const unassignedTokens = [];

        // Apply pinned subjects first
        subjectTokens.forEach(token => {
          const pinG = pinnedConfig[token.parent];
          if (pinG && pinG >= 1 && pinG <= groupCount) {
            currentGroups[pinG - 1].push(token);
          } else {
            unassignedTokens.push(token);
          }
        });

        // Fisher-Yates shuffle remaining tokens for unbiased placement
        shuffleArray(unassignedTokens);

        // Dynamic heuristic weights:
        // In target mode, fluctuate search tensions to discover diverse conflict spectrums
        let overlapWeight = 4.0;
        let balanceWeight = 1.5;

        if (isTargetMode) {
          if (randomTargetN === 0) {
            overlapWeight = 3.5 + Math.random() * 1.5;
            balanceWeight = 1.2 + Math.random() * 1.0;
          } else {
            if (iter % 4 === 0) {
              overlapWeight = 0.5 + Math.random() * 1.5;
              balanceWeight = 2.5 + Math.random() * 1.5;
            } else if (iter % 4 === 1) {
              overlapWeight = 1.6 + Math.random() * 1.8;
              balanceWeight = 1.5 + Math.random() * 1.0;
            } else if (iter % 4 === 2) {
              overlapWeight = 2.8 + Math.random() * 1.5;
              balanceWeight = 1.2;
            } else {
              overlapWeight = 3.8 + Math.random() * 1.5;
              balanceWeight = 1.0;
            }
          }
        }

        // Place tokens
        for (let tIdx = 0; tIdx < unassignedTokens.length; tIdx++) {
          const token = unassignedTokens[tIdx];
          const order = shuffleArray(Array.from({ length: groupCount }, (_, i) => i));

          let minScore = 999999;
          let tiedGroups = [];

          for (const gIdx of order) {
            // Cannot put into locked group (잠금된 그룹에는 기존 과목 외 다른 과목 유입 완전 차단)
            if (lockedGroupIndices.has(gIdx)) continue;

            // Cannot put two sections of the same parent subject into the same group
            const hasSameParent = currentGroups[gIdx].some(t => t.parent === token.parent);
            if (hasSameParent) continue;

            // Cannot put into group if any separatePair with an existing subject in this group
            const violatesSeparate = currentGroups[gIdx].some(t => {
              return separatePairs.some(p => (p[0] === t.parent && p[1] === token.parent) || (p[0] === token.parent && p[1] === t.parent));
            });
            if (violatesSeparate) continue;

            // If token has a togetherPair with a partner that is ALREADY placed in another group, token MUST go to that partner's group
            const togetherPartners = [];
            togetherPairs.forEach(p => {
              if (p[0] === token.parent) togetherPartners.push(p[1]);
              else if (p[1] === token.parent) togetherPartners.push(p[0]);
            });

            if (togetherPartners.length > 0) {
              let partnerGIdx = -1;
              for (let gi = 0; gi < groupCount; gi++) {
                if (currentGroups[gi].some(t => togetherPartners.includes(t.parent))) {
                  partnerGIdx = gi;
                  break;
                }
              }
              if (partnerGIdx !== -1 && partnerGIdx !== gIdx) {
                continue; // Partner is in a different group, so token cannot go here!
              }
            }

            let score = currentGroups[gIdx].length * balanceWeight;
            for (const existingToken of currentGroups[gIdx]) {
              const overlap = (coOccurrence[existingToken.parent] && coOccurrence[existingToken.parent][token.parent]) || 0;
              score += overlap * overlapWeight;
            }

            if (score < minScore) {
              minScore = score;
              tiedGroups = [gIdx];
            } else if (score === minScore) {
              tiedGroups.push(gIdx);
            }
          }

          if (tiedGroups.length === 0) {
            // No valid group could accept this token without violating hard constraints
            break;
          }

          const chosenGIdx = tiedGroups[Math.floor(Math.random() * tiedGroups.length)];
          currentGroups[chosenGIdx].push(token);
        }

        // Validate candidate configuration: 100% hard constraints satisfaction
        const totalPlaced = currentGroups.reduce((acc, g) => acc + g.length, 0);
        if (totalPlaced < subjectTokens.length) {
          continue; // Incomplete placement, reject
        }

        const satisfiesTogether = togetherPairs.every(([a, b]) => {
          return currentGroups.some(g => g.some(t => t.parent === a) && g.some(t => t.parent === b));
        });
        if (!satisfiesTogether) continue;

        const satisfiesSeparate = separatePairs.every(([a, b]) => {
          return !currentGroups.some(g => g.some(t => t.parent === a) && g.some(t => t.parent === b));
        });
        if (!satisfiesSeparate) continue;

        // Evaluate candidate configuration
        const { totalConflicts, conflictedStudentCount } = evaluateCandidateConflicts(currentGroups, studentsChoices, studentPinsForSem);

        // 1. Always update global best (for historical lowest record tracking & fallback)
        if (conflictedStudentCount < globalBestStudentConflicts || (conflictedStudentCount === globalBestStudentConflicts && totalConflicts < globalBestConflicts)) {
          globalBestStudentConflicts = conflictedStudentCount;
          globalBestConflicts = totalConflicts;
          globalBestGroups = currentGroups.map(g => [...g]);

          if (!isTargetMode && globalBestStudentConflicts === 0 && globalBestConflicts === 0) {
            break; // In pure 최적(0명) 탐색 mode, stop early on optimal zero
          }
        } else if (!isTargetMode && conflictedStudentCount === globalBestStudentConflicts && totalConflicts === globalBestConflicts) {
          if (Math.random() < 0.3) {
            globalBestGroups = currentGroups.map(g => [...g]);
          }
        }

        // 2. In Target Mode: collect candidate configurations within [min, max] range
        if (isTargetMode) {
          const diff = Math.abs(conflictedStudentCount - randomTargetN);
          if (diff < closestDiff) {
            closestDiff = diff;
            closestCandidate = {
              groups: currentGroups.map(g => [...g]),
              studentConflictCount: conflictedStudentCount,
              totalConflicts
            };
          }

          if (conflictedStudentCount >= targetRange.min && conflictedStudentCount <= targetRange.max) {
            const sig = currentGroups
              .map(g => g.map(t => t.name).sort().join(','))
              .sort()
              .join('|');

            if (!seenSignatures.has(sig)) {
              seenSignatures.add(sig);

              const sizes = currentGroups.map(g => g.length);
              const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
              const variance = sizes.reduce((sum, s) => sum + Math.pow(s - avgSize, 2), 0) / sizes.length;
              const balanceScore = variance * 2 + totalConflicts * 1.5;

              const candObj = {
                groups: currentGroups.map(g => [...g]),
                studentConflictCount: conflictedStudentCount,
                totalConflicts,
                balanceScore
              };

              if (!candidatesByCount[conflictedStudentCount]) {
                candidatesByCount[conflictedStudentCount] = [];
              }
              candidatesByCount[conflictedStudentCount].push(candObj);
              allRangeCandidates.push(candObj);
            }
          }
        }
      }

      // Determine chosen groups
      let chosenGroups = null;
      let finalTargetDrawn = randomTargetN;

      if (isTargetMode && allRangeCandidates.length > 0) {
        // 1순위: randomTargetN과 정확히 일치하는 후보안 풀에서 무작위 선택
        if (candidatesByCount[randomTargetN] && candidatesByCount[randomTargetN].length > 0) {
          const pool = candidatesByCount[randomTargetN];
          pool.sort((a, b) => a.balanceScore - b.balanceScore);
          const topPool = pool.slice(0, Math.min(10, pool.length));
          const picked = topPool[Math.floor(Math.random() * topPool.length)];
          chosenGroups = picked.groups;
          finalTargetDrawn = randomTargetN;
        } else {
          // 2순위: 범위 내에서 발견된 다른 충돌 인원수 버킷들 중 무작위 버킷 선택 (최소값에 편향되지 않음!)
          const availableCounts = Object.keys(candidatesByCount).map(Number);
          const pickedCount = availableCounts[Math.floor(Math.random() * availableCounts.length)];
          const pool = candidatesByCount[pickedCount];
          pool.sort((a, b) => a.balanceScore - b.balanceScore);
          const topPool = pool.slice(0, Math.min(10, pool.length));
          const picked = topPool[Math.floor(Math.random() * topPool.length)];
          chosenGroups = picked.groups;
          finalTargetDrawn = pickedCount;
        }
      } else if (isTargetMode && closestCandidate) {
        chosenGroups = closestCandidate.groups;
        finalTargetDrawn = closestCandidate.studentConflictCount;
      } else {
        chosenGroups = globalBestGroups;
      }

      if (!chosenGroups) {
        alert('⚠️ 설정된 [함께 묶을 과목] 또는 [함께 묶지 않을 과목] 조건을 모두 만족하는 그룹 조합을 찾을 수 없습니다.\n규칙 간 상충(예: 묶음과 분리가 모순)이나 과목 수/그룹 수 제약을 확인해주세요.');
        return;
      }

      // Update Historical Best Record (역대 최저치 기록)
      const history = AppState.simulationHistory[sem];
      history.runCount = (history.runCount || 0) + 1;

      if (history.minConflictEver === null || globalBestStudentConflicts < history.minConflictEver) {
        history.minConflictEver = globalBestStudentConflicts;
        history.minConflictPlan = {
          id: Date.now(),
          semester: sem,
          groups: globalBestGroups.map(g => g.map(t => t.name)),
          conflictCount: globalBestStudentConflicts,
          conflicts: [],
          customAssignments: {},
          memo: '',
          timestamp: new Date().toLocaleTimeString()
        };
        const minAnalysis = analyzeGroupConflicts(history.minConflictPlan);
        history.minConflictPlan.conflictCount = minAnalysis.conflictStudentCount;
        history.minConflictPlan.conflicts = minAnalysis.conflictDetails;
      }

      // Finalize AppState.currentPlan
      AppState.currentPlan = {
        id: Date.now(),
        semester: sem,
        groups: chosenGroups.map(g => g.map(t => t.name)),
        conflictCount: 0,
        conflicts: [],
        customAssignments: {},
        memo: '',
        targetRange: targetRange,
        targetDrawn: finalTargetDrawn,
        timestamp: new Date().toLocaleTimeString()
      };

      // Perform full detailed conflict & schedule analysis using bipartite matching
      const analysis = analyzeGroupConflicts(AppState.currentPlan);
      AppState.currentPlan.conflictCount = analysis.conflictStudentCount;
      AppState.currentPlan.conflicts = analysis.conflictDetails;

      if (!AppState.currentPlans) AppState.currentPlans = { 1: null, 2: null };
      AppState.currentPlans[sem] = AppState.currentPlan;

      renderStep2Results();
      saveAllState();
    }

    // 4) Accurate, Split-Aware Individual Student Schedule Assignment (2-Phase Conflict Avoidance + Load Balance)
    function computeStudentAssignments(plan) {
      const sem = plan.semester;
      const groups = plan.groups;
      const m = groups.length;
      const studentPinsForSem = AppState.studentPins.filter(p => p.semester === sem);
      if (!plan.customAssignments) plan.customAssignments = {};

      // Section enrollment counter to balance sections across groups (e.g. Japanese-A vs Japanese-B)
      const tokenEnrollmentCounts = {};
      groups.forEach(gTokens => {
        gTokens.forEach(tName => {
          tokenEnrollmentCounts[tName] = 0;
        });
      });

      // Fisher-Yates shuffle the student processing order to completely eliminate front-number bias
      const studentsList = AppState.students.slice();
      const randomizedIndices = shuffleArray([...Array(studentsList.length).keys()]);

      const assignmentResults = Array(studentsList.length);

      // Solve optimal bipartite assignment for a single student across all choices & split section combinations
      function solveStudentMatching(candidatesPerChoice) {
        const n = candidatesPerChoice.length;
        if (n === 0) return { matchedCount: 0, match: Array(m).fill(null), assignedChoices: new Set(), combo: [] };

        // Cartesian product of candidate choices across split sections (typically 1, 2, or 4 combinations)
        let combinations = [[]];
        for (let i = 0; i < n; i++) {
          const options = candidatesPerChoice[i];
          if (options.length === 0) {
            combinations = combinations.map(combo => [...combo, null]);
          } else {
            const nextCombos = [];
            for (const combo of combinations) {
              for (const opt of options) {
                nextCombos.push([...combo, opt]);
              }
            }
            combinations = nextCombos;
          }
        }

        // Shuffle combinations for unbiased tie-breaking
        shuffleArray(combinations);

        let bestResult = null;
        let maxMatched = -1;
        let bestLoadScore = 99999999;

        for (const combo of combinations) {
          const adj = [];
          for (let i = 0; i < n; i++) {
            adj[i] = combo[i] ? [combo[i].gIdx] : [];
          }

          const match = Array(m).fill(null); // g -> { choiceIdx, tokenName }
          function dfs(u, visited) {
            for (const v of adj[u]) {
              if (!visited[v]) {
                visited[v] = true;
                if (!match[v] || dfs(match[v].choiceIdx, visited)) {
                  match[v] = { choiceIdx: u, tokenName: combo[u].tokenName };
                  return true;
                }
              }
            }
            return false;
          }

          let matched = 0;
          const assignedSet = new Set();
          for (let u = 0; u < n; u++) {
            const visited = Array(m).fill(false);
            if (dfs(u, visited)) {
              matched++;
              assignedSet.add(u);
            }
          }

          // Calculate section enrollment load for fair balancing
          let currentLoad = 0;
          for (const opt of combo) {
            if (opt && opt.tokenName) {
              currentLoad += (tokenEnrollmentCounts[opt.tokenName] || 0);
            }
          }

          // 1순위: 매칭 과목 수 극대화 (충돌 회피 최우선)
          // 2순위: 분반 인원 균등화 (이미 배정된 인원이 적은 분반 우선)
          if (matched > maxMatched || (matched === maxMatched && currentLoad < bestLoadScore)) {
            maxMatched = matched;
            bestLoadScore = currentLoad;
            bestResult = {
              matchedCount: matched,
              match,
              assignedChoices: assignedSet,
              combo
            };
            if (maxMatched === n && currentLoad === 0) {
              break;
            }
          }
        }

        return bestResult;
      }

      // Process each student
      for (const stIdx of randomizedIndices) {
        const st = studentsList[stIdx];
        const closedList = AppState.closedSubjects?.[sem] || [];
        const closedNorms = new Set(closedList.map(s => normalizeSubject(s)));
        const choices = (sem === 1 ? st.sem1 : st.sem2).filter(s => !closedNorms.has(normalizeSubject(s)));
        const n = choices.length;

        // 1) If user has manually edited this student's schedule, honor it 100%
        if (plan.customAssignments && plan.customAssignments[st.id]) {
          const customMap = plan.customAssignments[st.id];
          const groupSubjects = {};
          let customAssignedCount = 0;
          let hasOverlapInGroup = false;

          for (let g = 0; g < m; g++) {
            groupSubjects[g] = (customMap[g] || []).slice();
            customAssignedCount += groupSubjects[g].length;
            if (groupSubjects[g].length > 1) {
              hasOverlapInGroup = true;
            }
            groupSubjects[g].forEach(tName => {
              tokenEnrollmentCounts[tName] = (tokenEnrollmentCounts[tName] || 0) + 1;
            });
          }

          const hasConflict = hasOverlapInGroup || (customAssignedCount < n);
          const schedule = Array(m).fill('');
          for (let g = 0; g < m; g++) {
            if (groupSubjects[g].length > 0) {
              schedule[g] = groupSubjects[g].join(' & ');
            }
          }

          assignmentResults[stIdx] = {
            id: st.id,
            classNum: st.classNum,
            studentNum: st.studentNum,
            name: st.name,
            career: st.career,
            schedule,
            groupSubjects,
            hasConflict,
            isManual: true
          };
          continue;
        }

        // 2) Standard optimal assignment
        const relevantPins = studentPinsForSem.filter(p => p.studentId === st.id);
        const candidatesPerChoice = [];
        for (let i = 0; i < n; i++) {
          const parentSubj = choices[i];
          const normParent = normalizeSubject(parentSubj);
          const options = [];
          for (let g = 0; g < m; g++) {
            const specificPin = relevantPins.find(p => normalizeSubject(p.subject) === normParent);
            if (specificPin && (g + 1) !== specificPin.group) continue;

            const matchedToken = groups[g].find(s => {
              const sParent = s.replace(/-[A-Z]$/, '');
              return normalizeSubject(sParent) === normParent;
            });
            if (matchedToken) {
              options.push({ gIdx: g, tokenName: matchedToken });
            }
          }
          candidatesPerChoice.push(options);
        }

        const matchResult = solveStudentMatching(candidatesPerChoice);
        const { matchedCount, match, assignedChoices } = matchResult;

        // Group subjects: gIdx -> array of assigned token names
        const groupSubjects = {};
        for (let g = 0; g < m; g++) {
          groupSubjects[g] = [];
        }

        for (let g = 0; g < m; g++) {
          if (match[g]) {
            groupSubjects[g].push(match[g].tokenName);
            tokenEnrollmentCounts[match[g].tokenName] = (tokenEnrollmentCounts[match[g].tokenName] || 0) + 1;
          }
        }

        // If any choices could not be matched, record the colliding group
        const hasConflict = matchedCount < n;
        if (hasConflict) {
          for (let u = 0; u < n; u++) {
            if (!assignedChoices.has(u)) {
              const availableOpts = candidatesPerChoice[u];
              if (availableOpts && availableOpts.length > 0) {
                const targetOpt = availableOpts[0];
                groupSubjects[targetOpt.gIdx].push(targetOpt.tokenName);
              }
            }
          }
        }

        const schedule = Array(m).fill('');
        for (let g = 0; g < m; g++) {
          if (groupSubjects[g].length > 0) {
            schedule[g] = groupSubjects[g].join(' & ');
          }
        }

        assignmentResults[stIdx] = {
          id: st.id,
          classNum: st.classNum,
          studentNum: st.studentNum,
          name: st.name,
          career: st.career,
          schedule,
          groupSubjects,
          hasConflict,
          isManual: false
        };
      }

      // Output display is always sorted by class and student number (1반 1번, 1반 2번...)
      return assignmentResults.sort((a, b) => {
        const cA = parseInt(String(a.classNum).replace(/[^0-9]/g, ''), 10) || 0;
        const cB = parseInt(String(b.classNum).replace(/[^0-9]/g, ''), 10) || 0;
        if (cA !== cB) return cA - cB;
        const nA = parseInt(String(a.studentNum).replace(/[^0-9]/g, ''), 10) || 0;
        const nB = parseInt(String(b.studentNum).replace(/[^0-9]/g, ''), 10) || 0;
        return nA - nB;
      });
    }

    // Plan Sanity Check: 플랜 내 과목들이 현재 학년/학기 과목인지 철저히 검증 (타 학년 과목 오염 100% 차단)
    function isPlanValidForCurrentGrade(plan, sem) {
      if (!plan || !plan.groups || !Array.isArray(plan.groups) || plan.groups.length === 0) return false;
      const expectedSem = sem || plan.semester || AppState.currentSemester || 1;
      if (plan.semester && plan.semester !== expectedSem) return false;

      const rawSubjects = (expectedSem === 1 ? AppState.sem1Subjects : AppState.sem2Subjects) || [];
      if (rawSubjects.length === 0) return true;

      const clean = str => String(str || '')
        .replace(/[-_]\s*(\d+|[A-Z]|[0-9]+반|[A-Z]반|\d+분반)\s*$/i, '')
        .replace(/\s*\(\s*(\d+|[A-Z]|\d+반|\d+분반)\s*\)\s*$/i, '')
        .replace(/[*※†‡★☆▲■●#^]/g, '')
        .replace(/\s+/g, '')
        .toLowerCase();
      const validSet = new Set(rawSubjects.map(clean));

      const planTokens = plan.groups.flat().filter(Boolean);
      if (planTokens.length === 0) return false;

      let validCount = 0;
      for (const tok of planTokens) {
        if (validSet.has(clean(tok))) {
          validCount++;
        }
      }

      return (validCount / planTokens.length) >= 0.6;
    }

    // 5) Conflict & Overlap Analysis (unified across UI, cards, table, and Excel export)
    function analyzeGroupConflicts(plan) {
      const groupCounts = Array(plan.groups.length).fill(0);
      const studentGroupOverlaps = {}; // studentId -> { gIdx: [subjects] }
      const conflictDetails = [];

      const assignments = computeStudentAssignments(plan);
      let conflictStudentCount = 0;

      assignments.forEach(asgn => {
        studentGroupOverlaps[asgn.id] = asgn.groupSubjects;
        let studentConflicted = false;

        plan.groups.forEach((_, gIdx) => {
          const inGrp = asgn.groupSubjects[gIdx] || [];
          if (inGrp.length > 1) {
            groupCounts[gIdx]++;
            studentConflicted = true;
            conflictDetails.push({
              studentId: asgn.id,
              classNum: asgn.classNum,
              studentNum: asgn.studentNum,
              name: asgn.name,
              group: gIdx + 1,
              subjects: inGrp.join(' & ')
            });
          }
        });

        if (studentConflicted || asgn.hasConflict) {
          conflictStudentCount++;
        }
      });

      return {
        groupCounts,
        studentGroupOverlaps,
        studentAssignments: assignments,
        conflictDetails,
        conflictStudentCount
      };
    }

    function renderStep2UI() {
      initStep2Controls();
      const sem = AppState.currentSemester || 1;
      if (!AppState.currentPlans) AppState.currentPlans = { 1: null, 2: null };

      let validPlan = null;
      if (AppState.currentPlans[sem] && isPlanValidForCurrentGrade(AppState.currentPlans[sem], sem)) {
        validPlan = AppState.currentPlans[sem];
      } else if (AppState.currentPlan && isPlanValidForCurrentGrade(AppState.currentPlan, sem)) {
        validPlan = AppState.currentPlan;
      } else {
        const validSaved = (AppState.savedPlans || []).filter(p => p.semester === sem && isPlanValidForCurrentGrade(p, sem));
        if (validSaved.length > 0) {
          validPlan = JSON.parse(JSON.stringify(validSaved[validSaved.length - 1]));
        }
      }

      if (validPlan) {
        AppState.currentPlan = validPlan;
        AppState.currentPlans[sem] = validPlan;
        renderStep2Results();
      } else {
        runOptimization();
      }
      renderSavedPlansList();
    }

    // Toggle Pin for a Subject to a Group
    window.toggleSubjectPin = function(subjectName, gIdx) {
      const sem = AppState.currentSemester;
      if (!AppState.pinnedSubjects) AppState.pinnedSubjects = { 1: {}, 2: {} };
      if (!AppState.pinnedSubjects[sem]) AppState.pinnedSubjects[sem] = {};

      const parentName = subjectName.replace(/-[A-Z]$/, '');
      if (AppState.pinnedSubjects[sem][parentName] === gIdx + 1) {
        delete AppState.pinnedSubjects[sem][parentName];
      } else {
        AppState.pinnedSubjects[sem][parentName] = gIdx + 1;
      }
      renderStep2Results();
      saveAllState();
    };

    // Toggle Group Lock (Lock / Unlock a group: locks existing subjects in place and blocks all other subjects from entering)
    window.toggleGroupLock = function(gIdx) {
      const plan = AppState.currentPlan;
      if (!plan || !plan.groups[gIdx]) return;
      const sem = plan.semester;
      if (!AppState.pinnedSubjects) AppState.pinnedSubjects = { 1: {}, 2: {} };
      if (!AppState.pinnedSubjects[sem]) AppState.pinnedSubjects[sem] = {};
      if (!AppState.lockedGroups) AppState.lockedGroups = { 1: {}, 2: {} };
      if (!AppState.lockedGroups[sem]) AppState.lockedGroups[sem] = {};

      const groupSubjs = plan.groups[gIdx];
      if (groupSubjs.length === 0) {
        alert('이 그룹에는 과목이 없어 잠글 수 없습니다.');
        return;
      }

      const isLocked = Boolean(AppState.lockedGroups[sem][gIdx]);

      if (isLocked) {
        // Unlock: unmark group lock and release pinned subjects in this group
        delete AppState.lockedGroups[sem][gIdx];
        groupSubjs.forEach(s => {
          const p = s.replace(/-[A-Z]$/, '');
          delete AppState.pinnedSubjects[sem][p];
        });
      } else {
        // Lock: Mark this group as locked (no other subjects can enter), and pin all current subjects to this group
        AppState.lockedGroups[sem][gIdx] = true;
        groupSubjs.forEach(s => {
          const p = s.replace(/-[A-Z]$/, '');
          AppState.pinnedSubjects[sem][p] = gIdx + 1;
        });
      }

      renderStep2Results();
      saveAllState();
    };
    window.toggleGroupPin = window.toggleGroupLock; // Alias for backward compatibility

    // Conflicted Students Table Accordion State (default: false = collapsed)
    let isConflictTableExpanded = false;

    window.toggleConflictTable = function(forceState) {
      if (typeof forceState === 'boolean') {
        isConflictTableExpanded = forceState;
      } else {
        isConflictTableExpanded = !isConflictTableExpanded;
      }
      const wrapper = document.getElementById('conflictTableWrapper');
      const btn = document.getElementById('btnToggleConflictTable');
      if (wrapper) {
        if (isConflictTableExpanded) {
          wrapper.classList.remove('hidden');
        } else {
          wrapper.classList.add('hidden');
        }
      }
      if (btn) {
        btn.innerHTML = isConflictTableExpanded 
          ? '<span>명단 접기 ▲</span>' 
          : '<span>명단 펼치기 ▼</span>';
        btn.title = isConflictTableExpanded ? '세부 명단 접기' : '세부 명단 펼치기';
      }
    };

    // Render Group Cards
    function renderStep2Results() {
      const plan = AppState.currentPlan;
      if (!plan) return;

      const { groupCounts, studentGroupOverlaps, studentAssignments } = analyzeGroupConflicts(plan);

      const sem = plan.semester;
      const targetConfig = AppState.targetConflictN?.[sem];
      const isTarget = Boolean(targetConfig);

      let minN = null, maxN = null;
      if (isTarget) {
        if (typeof targetConfig === 'number') {
          minN = targetConfig;
          maxN = targetConfig;
        } else if (targetConfig.min !== undefined && targetConfig.max !== undefined) {
          minN = targetConfig.min;
          maxN = targetConfig.max;
        }
      }

      // Update Conflict Badges
      statConflictCount.textContent = `${plan.conflictCount}명`;

      const groupCardsSection = document.getElementById('groupCardsSection');
      const closedList = AppState.closedSubjects?.[sem] || [];
      const totalClosedCount = closedList ? closedList.length : 0;

      if (plan.conflictCount === 0) {
        conflictStatusBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200';
        conflictStatusBadge.textContent = isTarget ? `충돌 0명 (목표 ${minN}~${maxN}명 중 0명)` : '충돌 없음 (최적)';
        
        // 폐강 과목이 존재하는 경우, 폐강 목록 조회를 위해 상자를 표시하고 단정하게 유지
        if (totalClosedCount > 0) {
          conflictAlertBox.className = 'lg:col-span-2 w-full bg-rose-50/70 border border-rose-200 rounded-xl p-4 shadow-sm space-y-2 flex flex-col justify-between transition-all';
          conflictAlertBox.classList.remove('hidden');
          conflictDetailCount.className = 'bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold';
          conflictDetailCount.textContent = '충돌 0건 (완벽)';
          conflictTableBody.innerHTML = `
            <tr>
              <td colspan="5" class="p-3 text-center font-bold text-emerald-700 bg-white">
                🎉 동일 그룹에 과목이 중복 배정된 충돌 학생이 없습니다!
              </td>
            </tr>
          `;
        } else {
          conflictAlertBox.classList.add('hidden');
        }

        if (groupCardsSection) {
          groupCardsSection.className = 'lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all';
        }
      } else {
        if (groupCardsSection) {
          groupCardsSection.className = 'lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all';
        }
        if (isTarget && plan.conflictCount >= minN && plan.conflictCount <= maxN) {
          conflictStatusBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200';
          if (minN === maxN) {
            conflictStatusBadge.textContent = `충돌 ${plan.conflictCount}명 (목표 ${minN}명 경우의 수)`;
          } else {
            const drawn = plan.targetDrawn !== undefined && plan.targetDrawn !== null ? plan.targetDrawn : plan.conflictCount;
            conflictStatusBadge.textContent = `충돌 ${plan.conflictCount}명 (목표 범위 ${minN}~${maxN}명 중 ${drawn}명 추출 조합)`;
          }
        } else if (isTarget) {
          conflictStatusBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300';
          conflictStatusBadge.textContent = `충돌 ${plan.conflictCount}명 (목표 ${minN}~${maxN}명 근접 조합)`;
        } else {
          conflictStatusBadge.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200';
          conflictStatusBadge.textContent = `충돌 ${plan.conflictCount}명 발생 (최적 탐색)`;
        }
        conflictDetailCount.className = 'bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full text-xs font-bold';
        conflictAlertBox.className = 'lg:col-span-2 w-full bg-rose-50/90 border border-rose-200 rounded-xl p-4 shadow-sm space-y-2 flex flex-col justify-between transition-all';
        conflictAlertBox.classList.remove('hidden');
      }

      if (plan.conflictCount > 0) {
        conflictDetailCount.textContent = `총 ${plan.conflicts.length}건`;
        conflictTableBody.innerHTML = plan.conflicts.map(c => `
          <tr class="hover:bg-rose-100/50">
            <td class="p-2 text-center font-medium">${c.classNum}반</td>
            <td class="p-2 text-center font-medium">${c.studentNum}번</td>
            <td class="p-2 text-center font-bold text-slate-900">${c.name}</td>
            <td class="p-2 text-center font-semibold text-rose-700">${c.group}그룹</td>
            <td class="p-2 font-bold text-slate-800">${c.subjects}</td>
          </tr>
        `).join('');
        // Maintain accordion state (default: collapsed)
        window.toggleConflictTable(isConflictTableExpanded);
      }

      // Render Closed Subjects from Previous Step (1단계 폐강 과목 및 신청인원 - 현재 탭 독립 기준)
      const closedContainer = document.getElementById('conflictClosedSubjectsList');
      if (closedContainer) {
        const mergedClosedList = closedList || [];

        if (mergedClosedList.length === 0) {
          closedContainer.innerHTML = `<span class="text-xs text-slate-500 italic bg-white/80 px-2.5 py-0.5 rounded-md border border-dashed border-rose-200">폐강 확정 과목 없음 (모든 선택과목 개설 대상)</span>`;
        } else {
          // 각 폐강 과목의 신청 인원 및 대상 학생 명단 집계 (현재 기준 날짜 고유 데이터만 사용)
          const closedItems = mergedClosedList.map(subj => {
            let studentsInCur = [];
            const normSubjTarget = normalizeSubject(subj);
            (AppState.students || []).forEach(st => {
              const selected = (sem === 1 ? st.sem1 : st.sem2) || [];
              if (selected.some(s => normalizeSubject(s) === normSubjTarget)) {
                const labelParts = [];
                if (st.classNum) labelParts.push(`${st.classNum}반`);
                if (st.studentNum) labelParts.push(`${st.studentNum}번`);
                labelParts.push(st.name || '학생');
                studentsInCur.push(labelParts.join(' '));
              }
            });

            return {
              subject: subj,
              count: studentsInCur.length,
              students: studentsInCur,
              dateNotice: '현재 기준'
            };
          });

          // 신청인원 내림차순 정렬
          closedItems.sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject, 'ko'));

          closedContainer.innerHTML = closedItems.map(item => {
            const studentText = item.students.length > 0 
              ? item.students.join(', ') 
              : '신청 학생 명단 없음';
            const tooltipTitle = `[${item.subject}] ${item.count}명 (${item.dateNotice})\n대상자: ${studentText}`;

            return `
              <div class="relative group inline-block">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-rose-900 border border-rose-300 shadow-2xs hover:bg-rose-50 transition cursor-help select-none"
                      title="${escapeHtml(tooltipTitle)}">
                  <span class="font-extrabold">${escapeHtml(item.subject)}</span>
                  <span class="text-rose-600 font-black bg-rose-100 px-1.5 py-0.5 rounded text-[11px]">(${item.count}명)</span>
                </span>
                <!-- 마우스 오버 시 표시되는 학생 명단 팝오버 툴팁 -->
                <div class="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col z-50 w-64 max-w-xs p-3 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl shadow-2xl border border-slate-700/80 transition-all duration-150">
                  <div class="flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-slate-700/80 text-rose-300 font-bold">
                    <span class="truncate text-xs">🚫 ${escapeHtml(item.subject)} (${item.count}명)</span>
                    <span class="text-[10px] text-slate-400 font-normal shrink-0">${escapeHtml(item.dateNotice)}</span>
                  </div>
                  <div class="text-[11px] text-slate-300 font-medium mb-1 flex items-center justify-between">
                    <span>수강 신청 학생 대상자:</span>
                    <span class="text-[10px] text-rose-300 font-bold">${item.students.length}명</span>
                  </div>
                  <div class="text-[11px] text-slate-100 max-h-40 overflow-y-auto leading-relaxed break-words bg-slate-800/90 p-2 rounded-lg border border-slate-700">
                    ${item.students.length > 0 
                      ? `<div class="flex flex-wrap gap-1">${item.students.map(s => `<span class="inline-block bg-slate-700/90 text-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-600">${escapeHtml(s)}</span>`).join('')}</div>`
                      : '<span class="text-slate-400 italic">신청 학생 없음</span>'}
                  </div>
                  <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700"></div>
                </div>
              </div>
            `;
          }).join('');
        }
      }

      // Update Historical Best Minimum Conflict Display & Restore Button
      const history = AppState.simulationHistory?.[sem] || { runCount: 0, minConflictEver: null, minConflictPlan: null };
      if (statBestConflictCount) {
        const bestVal = (history.minConflictEver !== null && history.minConflictEver !== undefined)
          ? history.minConflictEver 
          : (plan.conflictCount !== undefined && plan.conflictCount !== null ? plan.conflictCount : 0);
        const runs = history.runCount || 1;
        statBestConflictCount.textContent = `${bestVal}명 (총 ${runs}회 탐색)`;
      }

      if (btnRestoreBestPlan) {
        if (history.minConflictPlan && history.minConflictEver !== null && history.minConflictEver !== undefined && plan.conflictCount > history.minConflictEver) {
          btnRestoreBestPlan.classList.remove('hidden');
          btnRestoreBestPlan.textContent = `🏆 최저치(${history.minConflictEver}명) 안 복원`;
        } else {
          btnRestoreBestPlan.classList.add('hidden');
        }
      }

      const numGroups = plan.groups.length;
      if (groupCardsContainer) {
        if (numGroups <= 4) {
          groupCardsContainer.style.gridTemplateColumns = `repeat(${numGroups}, minmax(0, 1fr))`;
        } else if (numGroups === 5) {
          groupCardsContainer.style.gridTemplateColumns = `repeat(auto-fit, minmax(200px, 1fr))`;
        } else {
          // 6, 7, 8 groups (e.g. 3학년 2학기)
          groupCardsContainer.style.gridTemplateColumns = `repeat(auto-fit, minmax(210px, 1fr))`;
        }
      }

      // Total students in the schedule table
      const totalStudents = (studentAssignments || []).length;
      const totalBadge = document.getElementById('step2TotalStudentsBadge');
      if (totalBadge) {
        totalBadge.textContent = `(총 ${totalStudents}명)`;
      }

      // Group student counts: number of students who take a class in each group
      const groupStudentCounts = plan.groups.map((_, gIdx) => {
        let count = 0;
        (studentAssignments || []).forEach(asgn => {
          if ((asgn.groupSubjects[gIdx] || []).length > 0) {
            count++;
          }
        });
        return count;
      });

      let cardsHtml = '';

      plan.groups.forEach((groupSubjs, gIdx) => {
        let subjectsListHtml = '';
        let totalGroupEnrollment = 0;

        groupSubjs.forEach(sName => {
          const parentName = sName.replace(/-[A-Z]$/, '');
          const normParent = normalizeSubject(parentName);
          let count = 0;
          AppState.students.forEach(st => {
            const selected = (sem === 1 ? st.sem1 : st.sem2) || [];
            if (selected.some(s => normalizeSubject(s) === normParent)) {
              count++;
            }
          });

          if (sName.includes('-')) {
            count = Math.round(count / 2);
          }
          totalGroupEnrollment += count;

          let isSubjPinned = (AppState.pinnedSubjects?.[sem]?.[parentName] === gIdx + 1);
          if (!isSubjPinned && AppState.pinnedSubjects?.[sem]) {
            const pinKey = Object.keys(AppState.pinnedSubjects[sem]).find(k => normalizeSubject(k) === normParent);
            if (pinKey && AppState.pinnedSubjects[sem][pinKey] === gIdx + 1) {
              isSubjPinned = true;
            }
          }
          const pinBtnTitle = isSubjPinned 
            ? `[${parentName}] 과목이 ${gIdx + 1}그룹에 고정됨 (클릭 시 고정 해제)` 
            : `클릭 시 [${parentName}] 과목을 ${gIdx + 1}그룹에 고정 (조합 생성 시 유지)`;

          const pinBtnHtml = `
            <button type="button" 
                    onclick="event.stopPropagation(); window.toggleSubjectPin('${parentName}', ${gIdx});" 
                    class="p-0.5 px-1 rounded transition text-xs select-none cursor-pointer inline-flex items-center justify-center shrink-0 ${isSubjPinned ? 'text-blue-600 bg-blue-100 hover:bg-blue-200 font-black scale-110 shadow-2xs' : 'text-slate-300 hover:text-blue-600 hover:bg-slate-100 opacity-60 hover:opacity-100'}" 
                    title="${pinBtnTitle}">
              <span>📌</span>
            </button>
          `;

          const isSelectedForSwap = (subjectSwapState.selectedSubject === sName);
          const isSwapTargetCandidate = (subjectSwapState.selectedSubject && subjectSwapState.selectedSubject !== sName);

          let cardBgCls = '';
          let cardTitle = '';
          let swapBadgeHtml = '';

          if (isSelectedForSwap) {
            cardBgCls = 'bg-amber-100 border-amber-400 ring-2 ring-amber-400 shadow-md animate-pulse text-amber-950 font-black';
            cardTitle = `[${sName}] 1차 선택됨 (다시 클릭 시 취소, 다른 그룹 과목 클릭 시 맞교환)`;
            swapBadgeHtml = '<span class="bg-amber-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black animate-bounce shrink-0 mr-1">1차선택</span>';
          } else if (isSwapTargetCandidate) {
            if (subjectSwapState.selectedGroupIdx !== gIdx) {
              cardBgCls = isSubjPinned 
                ? 'bg-blue-50/90 border-blue-400 hover:border-amber-400 hover:bg-amber-50 hover:ring-2 hover:ring-amber-300 cursor-pointer' 
                : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50 hover:ring-2 hover:ring-amber-300 cursor-pointer';
              cardTitle = `클릭 시 [${subjectSwapState.selectedSubject}] 과(와) [${sName}] 그룹 위치 맞교환`;
              swapBadgeHtml = '<span class="text-amber-600 text-[10px] font-bold opacity-80 shrink-0 mr-1">⇄교환</span>';
            } else {
              cardBgCls = isSubjPinned ? 'bg-blue-50/80 border-blue-400' : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer';
              cardTitle = `클릭 시 1차 선택을 [${sName}] (으)로 변경`;
            }
          } else {
            cardBgCls = isSubjPinned 
              ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-300 hover:border-amber-400 hover:bg-blue-100/60 cursor-pointer' 
              : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 cursor-pointer';
            cardTitle = `클릭하여 [${sName}] 맞교환 1차 선택 (다른 그룹 과목과 교체)`;
          }

          const cardsHtmlSubj = `
            <div onclick="window.handleSubjectSwapClick('${sName}', ${gIdx});" 
                 class="group/card flex items-center justify-between p-2.5 rounded-lg border shadow-2xs transition-all select-none ${cardBgCls}" 
                 title="${cardTitle}">
              <div class="flex items-center min-w-0 flex-1 mr-2 gap-1.5">
                ${swapBadgeHtml}
                <span class="text-xs font-bold leading-snug break-keep ${isSelectedForSwap ? 'text-amber-950 font-black' : (isSubjPinned ? 'text-blue-900 font-black' : 'text-slate-800')} group-hover/card:text-amber-900" title="${sName}">${sName}</span>
                ${pinBtnHtml}
                <span class="text-[10px] text-slate-400 opacity-0 group-hover/card:opacity-100 transition-opacity ml-0.5 select-none shrink-0" title="과목 위치 맞교환">⇄</span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <span class="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 whitespace-nowrap">${count}명</span>
                <button type="button" onclick="event.stopPropagation(); window.removeSubjectFromGroup('${sName}', ${gIdx});" class="p-0.5 px-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover/card:opacity-100 transition-opacity select-none cursor-pointer" title="[${sName}] ${gIdx + 1}그룹에서 삭제">✕</button>
              </div>
            </div>
          `;
          subjectsListHtml += cardsHtmlSubj;
        });

        // Group conflict badge
        const groupConflict = groupCounts[gIdx];
        const conflictBadgeHtml = groupConflict === 0
          ? `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">중복 0</span>`
          : `<span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 whitespace-nowrap animate-pulse">중복 ${groupConflict}</span>`;

        // Check if group is locked (Group locked: marks locked and blocks other subjects from entering)
        const isGroupLocked = Boolean(AppState.lockedGroups?.[sem]?.[gIdx]);

        const groupLockBtnTitle = isGroupLocked
          ? `[${gIdx + 1}그룹] 잠금됨: 그룹 내 과목이 고정되며 다른 과목이 들어올 수 없습니다 (클릭 시 잠금 해제)`
          : `클릭 시 [${gIdx + 1}그룹]을 잠급니다 (현재 과목 고정 & 다른 과목 유입 완전 차단)`;

        const groupLockBtnHtml = `
          <button type="button" 
                  onclick="event.stopPropagation(); window.toggleGroupLock(${gIdx});" 
                  class="p-0.5 px-1.5 rounded transition text-xs select-none cursor-pointer inline-flex items-center gap-1 shrink-0 ${isGroupLocked ? 'text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 font-extrabold shadow-2xs' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 border border-slate-200 opacity-70 hover:opacity-100'}" 
                  title="${groupLockBtnTitle}">
            <span>${isGroupLocked ? '🔒' : '🔓'}</span>
            <span class="text-[10px] ${isGroupLocked ? 'font-black text-amber-950' : 'font-semibold'}">${isGroupLocked ? '잠김' : '잠금'}</span>
          </button>
        `;

        const isMoveTargetGroup = Boolean(subjectSwapState.selectedSubject) && (subjectSwapState.selectedGroupIdx !== gIdx) && !isGroupLocked;
        let moveBtnHtml = '';
        let moveDropZoneHtml = '';
        if (isMoveTargetGroup) {
          moveBtnHtml = `
            <button type="button" 
                    onclick="event.stopPropagation(); window.moveSelectedSubjectToGroup(${gIdx});" 
                    class="px-2 py-0.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md shadow-2xs transition flex items-center gap-1 cursor-pointer animate-pulse shrink-0" 
                    title="[${subjectSwapState.selectedSubject}] 과목을 ${gIdx + 1}그룹으로 바로 이동">
              <span>📥 이동</span>
            </button>
          `;
          moveDropZoneHtml = `
            <div onclick="event.stopPropagation(); window.moveSelectedSubjectToGroup(${gIdx});" 
                 class="border-2 border-dashed border-blue-400 bg-blue-50/70 hover:bg-blue-100 rounded-lg p-2 text-center text-xs font-bold text-blue-700 cursor-pointer transition select-none flex items-center justify-center gap-1 shadow-2xs">
              <span>📥 [${subjectSwapState.selectedSubject}] 이 그룹으로 이동</span>
            </div>
          `;
        }

        let groupCardBorderCls = 'bg-slate-50 border-slate-200';
        if (isMoveTargetGroup) {
          groupCardBorderCls = 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-300/50 hover:bg-blue-50/80 cursor-pointer';
        } else if (isGroupLocked) {
          groupCardBorderCls = 'bg-amber-50/20 border-amber-300 ring-1 ring-amber-200 shadow-2xs';
        }

        cardsHtml += `
          <div ${isMoveTargetGroup ? `onclick="window.moveSelectedSubjectToGroup(${gIdx});"` : ''} class="${groupCardBorderCls} border rounded-xl p-3.5 shadow-2xs flex flex-col space-y-2.5 transition-all">
            <div class="flex items-center justify-between border-b border-slate-200 pb-2">
              <div class="flex items-center space-x-1.5 shrink-0">
                <span class="w-6 h-6 rounded-md bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">${gIdx + 1}</span>
                <h5 class="text-xs font-bold text-slate-800 whitespace-nowrap">${gIdx + 1}그룹(${groupStudentCounts[gIdx]}명)</h5>
                ${groupLockBtnHtml}
              </div>
              <div class="flex items-center space-x-1 shrink-0">
                ${moveBtnHtml}
                ${conflictBadgeHtml}
                <span class="text-[11px] text-slate-400 font-medium whitespace-nowrap">(${groupSubjs.length}과목)</span>
              </div>
            </div>
            <div class="space-y-1.5 flex-1 max-h-72 overflow-y-auto custom-scrollbar pr-0.5">
              ${subjectsListHtml || '<p class="text-xs text-slate-400 italic">배치된 과목 없음</p>'}
              ${moveDropZoneHtml}
            </div>
          </div>
        `;
      });

      groupCardsContainer.innerHTML = cardsHtml;
      renderStudentScheduleTable();
    }

    // ==========================================
    // 5. STUDENT SCHEDULE TABLE: EXCEL-STYLE FILTERING, SORTING & MANUAL SUBJECT SWAP
    // ==========================================

    // Subject Swap (과목 위치 맞교환) State
    const subjectSwapState = {
      active: false,
      selectedSubject: null,
      selectedGroupIdx: null,
      undoStack: []
    };

    window.toggleSubjectSwapMode = function(forceState) {
      if (forceState !== undefined) {
        subjectSwapState.active = forceState;
      } else {
        subjectSwapState.active = !subjectSwapState.active;
      }
      if (!subjectSwapState.active) {
        subjectSwapState.selectedSubject = null;
        subjectSwapState.selectedGroupIdx = null;
      }
      updateSubjectSwapUI();
      renderStep2Results();
    };

    window.startSubjectSwap = function(sName, gIdx) {
      subjectSwapState.active = true;
      subjectSwapState.selectedSubject = sName;
      subjectSwapState.selectedGroupIdx = gIdx;
      updateSubjectSwapUI();
      renderStep2Results();
    };

    window.cancelSubjectSwap = function() {
      const prev = subjectSwapState.selectedSubject;
      subjectSwapState.selectedSubject = null;
      subjectSwapState.selectedGroupIdx = null;
      renderStep2Results();
      updateSubjectSwapUI(prev ? `[${prev}] 선택이 취소되었습니다.` : '과목 선택이 취소되었습니다.');
    };

    function updateSubjectSwapUI(customMsg) {
      const banner = document.getElementById('subjectSwapBanner');
      const bannerText = document.getElementById('subjectSwapBannerText');
      const toggleBtn = document.getElementById('btnToggleSubjectSwap');
      const undoBtn = document.getElementById('btnUndoSubjectSwap');

      // Group Cards area banner elements
      const gcBanner = document.getElementById('groupCardsSwapBanner');
      const gcBannerText = document.getElementById('groupCardsSwapBannerText');
      const gcCompleteBtn = document.getElementById('btnGroupCardsCompleteSwap');
      const gcUndoBtn = document.getElementById('btnGroupCardsUndoSwap');
      const gcCancelBtn = document.getElementById('btnGroupCardsCancelSwap');

      const tblCompleteBtn = document.getElementById('btnCompleteTableSwap');

      const hasUndo = subjectSwapState.undoStack && subjectSwapState.undoStack.length > 0;
      const lastUndo = hasUndo ? subjectSwapState.undoStack[subjectSwapState.undoStack.length - 1] : null;

      // Update complete buttons
      if (gcCompleteBtn) {
        if (hasUndo) {
          gcCompleteBtn.classList.remove('hidden');
        } else {
          gcCompleteBtn.classList.add('hidden');
        }
      }
      if (tblCompleteBtn) {
        if (hasUndo) {
          tblCompleteBtn.classList.remove('hidden');
        } else {
          tblCompleteBtn.classList.add('hidden');
        }
      }

      // Update undo buttons
      if (hasUndo && lastUndo) {
        const undoTitle = lastUndo.action === 'move'
          ? `[${lastUndo.subjA}] (${lastUndo.fromGroup}그룹 → ${lastUndo.toGroup}그룹 이동) 되돌리기`
          : `[${lastUndo.subjA}] ⇄ [${lastUndo.subjB}] 맞교환 되돌리기`;
        if (undoBtn) {
          undoBtn.classList.remove('hidden');
          undoBtn.title = undoTitle;
        }
        if (gcUndoBtn) {
          gcUndoBtn.classList.remove('hidden');
          gcUndoBtn.title = undoTitle;
        }
      } else {
        if (undoBtn) undoBtn.classList.add('hidden');
        if (gcUndoBtn) gcUndoBtn.classList.add('hidden');
      }

      // Update cancel button in group cards banner
      if (gcCancelBtn) {
        if (subjectSwapState.selectedSubject) {
          gcCancelBtn.classList.remove('hidden');
        } else {
          gcCancelBtn.classList.add('hidden');
        }
      }

      // Format selection info message
      const gName = (subjectSwapState.selectedGroupIdx !== null && subjectSwapState.selectedGroupIdx !== undefined) 
        ? `${subjectSwapState.selectedGroupIdx + 1}그룹` : '';
      const defaultSelectionMsg = subjectSwapState.selectedSubject
        ? `👉 <strong>1차 선택: [${subjectSwapState.selectedSubject}]</strong> (${gName}) &nbsp;→&nbsp; 자리를 바꿀 <strong>다른 그룹의 과목</strong>을 클릭하면 '맞교환', 그룹 헤더의 <strong>'📥 이동'</strong>을 클릭하면 '그룹 이동'됩니다.`
        : null;

      // Group Cards Banner visibility & text
      if (gcBanner) {
        if (customMsg || subjectSwapState.selectedSubject || hasUndo) {
          gcBanner.classList.remove('hidden');
          if (gcBannerText) {
            if (customMsg) {
              gcBannerText.innerHTML = customMsg;
            } else if (defaultSelectionMsg) {
              gcBannerText.innerHTML = defaultSelectionMsg;
            } else if (hasUndo) {
              const recentDesc = lastUndo.action === 'move'
                ? `[${lastUndo.subjA}] (${lastUndo.fromGroup}그룹 → ${lastUndo.toGroup}그룹 이동)`
                : `[${lastUndo.subjA}] ⇄ [${lastUndo.subjB}] 맞교환`;
              gcBannerText.innerHTML = `과목을 클릭하여 맞교환하거나 그룹으로 이동할 수 있습니다. (최근 작업: ${recentDesc})`;
            }
          }
        } else {
          gcBanner.classList.add('hidden');
        }
      }

      // Table swap toggle button & banner
      if (toggleBtn) {
        if (subjectSwapState.active) {
          toggleBtn.className = 'px-3 py-1.5 text-xs font-black text-amber-950 bg-amber-200 hover:bg-amber-300 border-2 border-amber-400 rounded-lg shadow-xs transition flex items-center gap-1.5 ring-2 ring-amber-300 cursor-pointer';
          toggleBtn.innerHTML = '<span>🔀 과목 맞교환 모드 ON</span>';
          if (banner) banner.classList.remove('hidden');

          if (bannerText) {
            if (customMsg) {
              bannerText.innerHTML = customMsg;
            } else if (defaultSelectionMsg) {
              bannerText.innerHTML = defaultSelectionMsg;
            } else {
              bannerText.innerHTML = `<strong>[과목 맞교환 모드]</strong> 자리를 바꿀 첫 번째 <strong>과목(A)</strong>의 헤더를 클릭하세요.`;
            }
          }
        } else {
          toggleBtn.className = 'px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer';
          toggleBtn.innerHTML = '<span>🔀 과목 위치 맞교환</span>';
          if (banner) banner.classList.add('hidden');
        }
      }
    }

    window.handleSubjectSwapClick = function(sName, gIdx) {
      const plan = AppState.currentPlan;
      if (!plan) return;

      // If nothing selected yet, select 1st subject
      if (!subjectSwapState.selectedSubject) {
        subjectSwapState.active = true;
        subjectSwapState.selectedSubject = sName;
        subjectSwapState.selectedGroupIdx = gIdx;
        renderStep2Results();
        updateSubjectSwapUI();
        return;
      }

      // If clicked the exact same subject, cancel selection
      if (subjectSwapState.selectedSubject === sName) {
        const prev = subjectSwapState.selectedSubject;
        subjectSwapState.selectedSubject = null;
        subjectSwapState.selectedGroupIdx = null;
        renderStep2Results();
        updateSubjectSwapUI(`[${prev}] 선택이 취소되었습니다. 자리를 바꿀 과목을 다시 클릭하세요.`);
        return;
      }

      // If clicked another subject in the SAME group, switch 1st selection
      if (subjectSwapState.selectedGroupIdx === gIdx) {
        subjectSwapState.selectedSubject = sName;
        subjectSwapState.selectedGroupIdx = gIdx;
        renderStep2Results();
        updateSubjectSwapUI(`1차 선택이 <strong>[${sName}]</strong> (${gIdx + 1}그룹) (으)로 변경되었습니다. 맞교환할 <strong>다른 그룹의 과목</strong>을 클릭하세요.`);
        return;
      }

      // Otherwise, subjects are in different groups -> Perform swap!
      const subjA = subjectSwapState.selectedSubject;
      const subjB = sName;

      let gA = -1, sA = -1;
      let gB = -1, sB = -1;

      plan.groups.forEach((groupSubjs, gi) => {
        groupSubjs.forEach((sn, si) => {
          if (sn === subjA) { gA = gi; sA = si; }
          if (sn === subjB) { gB = gi; sB = si; }
        });
      });

      if (gA === -1 || gB === -1) {
        alert('과목 위치를 찾을 수 없습니다.');
        subjectSwapState.selectedSubject = null;
        subjectSwapState.selectedGroupIdx = null;
        renderStep2Results();
        updateSubjectSwapUI();
        return;
      }

      // Check if either group is locked
      const isLockedA = Boolean(AppState.lockedGroups?.[plan.semester]?.[gA]);
      const isLockedB = Boolean(AppState.lockedGroups?.[plan.semester]?.[gB]);
      if (isLockedA || isLockedB) {
        const lockedGrp = isLockedA ? (gA + 1) : (gB + 1);
        alert(`🔒 [그룹 잠금 안내]\n${lockedGrp}그룹은 '잠금' 상태이므로 과목을 맞교환할 수 없습니다.\n과목을 변경하려면 먼저 ${lockedGrp}그룹의 잠금을 해제해주세요.`);
        subjectSwapState.selectedSubject = null;
        subjectSwapState.selectedGroupIdx = null;
        renderStep2Results();
        updateSubjectSwapUI();
        return;
      }

      // Check if swap violates togetherPairs or separatePairs
      const togetherPairs = AppState.togetherPairs?.[plan.semester] || [];
      const separatePairs = AppState.separatePairs?.[plan.semester] || [];

      if (togetherPairs.length > 0 || separatePairs.length > 0) {
        const testGroups = plan.groups.map(g => [...g]);
        testGroups[gA][sA] = subjB;
        testGroups[gB][sB] = subjA;

        const violations = [];
        for (const [a, b] of togetherPairs) {
          const hasTogether = testGroups.some(g => {
            const hasA = g.some(s => s.replace(/-[A-Z]$/, '') === a || s === a);
            const hasB = g.some(s => s.replace(/-[A-Z]$/, '') === b || s === b);
            return hasA && hasB;
          });
          if (!hasTogether) {
            violations.push(`• [${a}] 🔗 [${b}]: 함께 묶을 과목 규칙 위반 (서로 다른 그룹으로 분리됨)`);
          }
        }

        for (const [a, b] of separatePairs) {
          for (let gi = 0; gi < testGroups.length; gi++) {
            const g = testGroups[gi];
            const hasA = g.some(s => s.replace(/-[A-Z]$/, '') === a || s === a);
            const hasB = g.some(s => s.replace(/-[A-Z]$/, '') === b || s === b);
            if (hasA && hasB) {
              violations.push(`• [${a}] ≠ [${b}]: 함께 묶지 않을 과목 규칙 위반 (${gi + 1}그룹에 동시 배치됨)`);
              break;
            }
          }
        }

        if (violations.length > 0) {
          const confirmMsg = `⚠️ [설정 규칙 위반 알림]\n이 맞교환을 실행하면 다음 규칙이 위반됩니다:\n\n${violations.join('\n')}\n\n그래도 맞교환을 진행하시겠습니까?`;
          if (!confirm(confirmMsg)) {
            subjectSwapState.selectedSubject = null;
            subjectSwapState.selectedGroupIdx = null;
            renderStep2Results();
            updateSubjectSwapUI('과목 맞교환이 취소되었습니다.');
            return;
          }
        }
      }

      // Record in undo stack
      subjectSwapState.undoStack.push({
        planBefore: JSON.parse(JSON.stringify(plan.groups)),
        subjA,
        subjB,
        gA: gA + 1,
        gB: gB + 1
      });

      // Perform swap
      plan.groups[gA][sA] = subjB;
      plan.groups[gB][sB] = subjA;

      // Recalculate conflicts
      const analysis = analyzeGroupConflicts(plan);
      plan.conflictCount = analysis.conflictStudentCount;
      plan.conflicts = analysis.conflictDetails;

      // Sync with saved plan if linked
      const match = AppState.savedPlans.find(p => p.id === plan.id);
      if (match) {
        match.groups = JSON.parse(JSON.stringify(plan.groups));
        match.conflictCount = plan.conflictCount;
        match.conflicts = JSON.parse(JSON.stringify(plan.conflicts));
        match.groupCounts = JSON.parse(JSON.stringify(analysis.groupCounts));
        match.studentGroupOverlaps = JSON.parse(JSON.stringify(analysis.studentGroupOverlaps));
      }

      // Check historical best minimum
      const sem = plan.semester;
      if (!AppState.simulationHistory) AppState.simulationHistory = { 1: { runCount: 1, minConflictEver: null }, 2: { runCount: 1, minConflictEver: null } };
      if (!AppState.simulationHistory[sem]) AppState.simulationHistory[sem] = { runCount: 1, minConflictEver: null };
      if (AppState.simulationHistory[sem].minConflictEver === null || plan.conflictCount < AppState.simulationHistory[sem].minConflictEver) {
        AppState.simulationHistory[sem].minConflictEver = plan.conflictCount;
        AppState.simulationHistory[sem].minConflictPlan = JSON.parse(JSON.stringify(plan));
      }

      // Clear selection
      subjectSwapState.selectedSubject = null;
      subjectSwapState.selectedGroupIdx = null;

      renderStep2Results();
      renderSavedPlansList();
      saveAllState();

      const msg = `✅ <strong>[${subjA}]</strong> (${gA + 1}그룹) ⇄ <strong>[${subjB}]</strong> (${gB + 1}그룹) 맞교환 완료! (현재 수강 충돌: <strong>${plan.conflictCount}명</strong>)`;
      updateSubjectSwapUI(msg);
    };

    // Keep backwards compatibility for any internal call without window
    const handleSubjectSwapClick = window.handleSubjectSwapClick;

    window.undoSubjectSwap = function() {
      if (subjectSwapState.undoStack.length === 0) return;
      const last = subjectSwapState.undoStack.pop();
      AppState.currentPlan.groups = last.planBefore;

      const analysis = analyzeGroupConflicts(AppState.currentPlan);
      AppState.currentPlan.conflictCount = analysis.conflictStudentCount;
      AppState.currentPlan.conflicts = analysis.conflictDetails;

      const match = AppState.savedPlans.find(p => p.id === AppState.currentPlan.id);
      if (match) {
        match.groups = JSON.parse(JSON.stringify(AppState.currentPlan.groups));
        match.conflictCount = AppState.currentPlan.conflictCount;
        match.conflicts = JSON.parse(JSON.stringify(AppState.currentPlan.conflicts));
        match.groupCounts = JSON.parse(JSON.stringify(analysis.groupCounts));
        match.studentGroupOverlaps = JSON.parse(JSON.stringify(analysis.studentGroupOverlaps));
      }

      subjectSwapState.selectedSubject = null;
      subjectSwapState.selectedGroupIdx = null;

      renderStep2Results();
      renderSavedPlansList();
      saveAllState();

      const undoMsg = last.action === 'move'
        ? `↩️ <strong>[${last.subjA}]</strong> 과목의 그룹 이동(${last.fromGroup}그룹 → ${last.toGroup}그룹)이 취소되어 원래 위치로 복원되었습니다. (충돌: <strong>${analysis.conflictStudentCount}명</strong>)`
        : `↩️ <strong>[${last.subjA}]</strong> ⇄ <strong>[${last.subjB}]</strong> 맞교환이 이전 상태로 되돌려졌습니다. (충돌: <strong>${analysis.conflictStudentCount}명</strong>)`;
      const bannerText = document.getElementById('subjectSwapBannerText');
      if (bannerText) {
        bannerText.innerHTML = undoMsg;
      }
      updateSubjectSwapUI(undoMsg);
    };

    window.moveSelectedSubjectToGroup = function(targetGIdx) {
      const plan = AppState.currentPlan;
      if (!plan) return;

      const sName = subjectSwapState.selectedSubject;
      const fromGIdx = subjectSwapState.selectedGroupIdx;
      if (!sName || fromGIdx === null || fromGIdx === undefined) return;

      if (fromGIdx === targetGIdx) {
        alert('이미 해당 그룹에 속해 있는 과목입니다.');
        return;
      }

      // Check if target or origin group is locked
      const isTargetLocked = Boolean(AppState.lockedGroups?.[plan.semester]?.[targetGIdx]);
      if (isTargetLocked) {
        alert(`🔒 [그룹 잠금 안내]\n${targetGIdx + 1}그룹은 '잠금' 상태이므로 다른 과목이 들어올 수 없습니다.\n과목을 이동하려면 먼저 ${targetGIdx + 1}그룹의 잠금을 해제해주세요.`);
        return;
      }
      const isFromLocked = Boolean(AppState.lockedGroups?.[plan.semester]?.[fromGIdx]);
      if (isFromLocked) {
        alert(`🔒 [그룹 잠금 안내]\n${fromGIdx + 1}그룹은 '잠금' 상태이므로 소속 과목을 다른 그룹으로 이동할 수 없습니다.\n과목을 이동하려면 먼저 ${fromGIdx + 1}그룹의 잠금을 해제해주세요.`);
        return;
      }

      // Check section conflict: cannot put two sections of the same parent subject in the same group
      const parentName = sName.replace(/-[A-Z]$/, '');
      const targetHasSameParent = plan.groups[targetGIdx].some(s => s.replace(/-[A-Z]$/, '') === parentName);
      if (targetHasSameParent) {
        alert(`⚠️ [분반 충돌]\n[${parentName}] 과목의 다른 분반이 이미 ${targetGIdx + 1}그룹에 개설되어 있습니다.\n동일 과목의 분반은 같은 그룹에 함께 배치할 수 없습니다.`);
        return;
      }

      // Check together / separate rule constraints
      const togetherPairs = AppState.togetherPairs?.[plan.semester] || [];
      const separatePairs = AppState.separatePairs?.[plan.semester] || [];

      if (togetherPairs.length > 0 || separatePairs.length > 0) {
        const testGroups = plan.groups.map(g => [...g]);
        // Remove from origin
        testGroups[fromGIdx] = testGroups[fromGIdx].filter(s => s !== sName);
        // Add to target
        testGroups[targetGIdx].push(sName);

        const violations = [];
        for (const [a, b] of togetherPairs) {
          const hasTogether = testGroups.some(g => {
            const hasA = g.some(s => s.replace(/-[A-Z]$/, '') === a || s === a);
            const hasB = g.some(s => s.replace(/-[A-Z]$/, '') === b || s === b);
            return hasA && hasB;
          });
          if (!hasTogether) {
            violations.push(`• [${a}] 🔗 [${b}]: 함께 묶을 과목 규칙 위반 (서로 다른 그룹으로 분리됨)`);
          }
        }

        for (const [a, b] of separatePairs) {
          for (let gi = 0; gi < testGroups.length; gi++) {
            const g = testGroups[gi];
            const hasA = g.some(s => s.replace(/-[A-Z]$/, '') === a || s === a);
            const hasB = g.some(s => s.replace(/-[A-Z]$/, '') === b || s === b);
            if (hasA && hasB) {
              violations.push(`• [${a}] ≠ [${b}]: 함께 묶지 않을 과목 규칙 위반 (${gi + 1}그룹에 동시 배치됨)`);
              break;
            }
          }
        }

        if (violations.length > 0) {
          const confirmMsg = `⚠️ [설정 규칙 위반 알림]\n이 이동을 실행하면 다음 규칙이 위반됩니다:\n\n${violations.join('\n')}\n\n그래도 이동을 진행하시겠습니까?`;
          if (!confirm(confirmMsg)) {
            subjectSwapState.selectedSubject = null;
            subjectSwapState.selectedGroupIdx = null;
            renderStep2Results();
            updateSubjectSwapUI('과목 이동이 취소되었습니다.');
            return;
          }
        }
      }

      // Record in undo stack
      subjectSwapState.undoStack.push({
        planBefore: JSON.parse(JSON.stringify(plan.groups)),
        action: 'move',
        subjA: sName,
        fromGroup: fromGIdx + 1,
        toGroup: targetGIdx + 1
      });

      // Execute move
      plan.groups[fromGIdx] = plan.groups[fromGIdx].filter(s => s !== sName);
      plan.groups[targetGIdx].push(sName);

      // If the subject was pinned to fromGIdx, update pin to targetGIdx
      const sem = plan.semester;
      if (AppState.pinnedSubjects?.[sem]?.[parentName] === fromGIdx + 1) {
        AppState.pinnedSubjects[sem][parentName] = targetGIdx + 1;
      }

      // Recalculate conflicts
      const analysis = analyzeGroupConflicts(plan);
      plan.conflictCount = analysis.conflictStudentCount;
      plan.conflicts = analysis.conflictDetails;

      // Sync with linked saved plan
      const match = AppState.savedPlans.find(p => p.id === plan.id);
      if (match) {
        match.groups = JSON.parse(JSON.stringify(plan.groups));
        match.conflictCount = plan.conflictCount;
        match.conflicts = JSON.parse(JSON.stringify(plan.conflicts));
        match.groupCounts = JSON.parse(JSON.stringify(analysis.groupCounts));
        match.studentGroupOverlaps = JSON.parse(JSON.stringify(analysis.studentGroupOverlaps));
      }

      // Update historical best
      if (!AppState.simulationHistory) AppState.simulationHistory = { 1: { runCount: 1, minConflictEver: null }, 2: { runCount: 1, minConflictEver: null } };
      if (!AppState.simulationHistory[sem]) AppState.simulationHistory[sem] = { runCount: 1, minConflictEver: null };
      if (AppState.simulationHistory[sem].minConflictEver === null || plan.conflictCount < AppState.simulationHistory[sem].minConflictEver) {
        AppState.simulationHistory[sem].minConflictEver = plan.conflictCount;
        AppState.simulationHistory[sem].minConflictPlan = JSON.parse(JSON.stringify(plan));
      }

      // Clear selection
      subjectSwapState.selectedSubject = null;
      subjectSwapState.selectedGroupIdx = null;

      renderStep2Results();
      renderSavedPlansList();
      saveAllState();

      const msg = `✅ <strong>[${sName}]</strong> 과목이 <strong>${fromGIdx + 1}그룹 → ${targetGIdx + 1}그룹</strong>으로 이동되었습니다! (현재 수강 충돌: <strong>${plan.conflictCount}명</strong>)`;
      updateSubjectSwapUI(msg);
    };

    window.completeSubjectSwap = function() {
      const swapCount = subjectSwapState.undoStack ? subjectSwapState.undoStack.length : 0;
      subjectSwapState.active = false;
      subjectSwapState.selectedSubject = null;
      subjectSwapState.selectedGroupIdx = null;
      subjectSwapState.undoStack = [];

      renderStep2Results();
      updateSubjectSwapUI();
      saveAllState();

      if (swapCount > 0) {
        alert(`✅ 과목 맞교환 작업이 확정·완료되었습니다.\n(현재 편성 충돌: ${AppState.currentPlan ? AppState.currentPlan.conflictCount : 0}명)`);
      }
    };

    // Filter and Sort state for Student Schedule Table
    const scheduleTableFilterState = {
      search: '',
      statusFilter: 'all', // 'all' | 'conflict' | 'normal' | 'manual'
      sortCol: 'default',   // 'default' | 'classNum' | 'studentNum' | 'name' | 'career' | 'status' | subject token name
      sortDir: 'asc'        // 'asc' | 'desc'
    };

    window.handleSubjectHeaderClick = function(sName, gIdx) {
      if (subjectSwapState.active) {
        handleSubjectSwapClick(sName, gIdx);
        return;
      }

      if (scheduleTableFilterState.sortCol !== sName) {
        scheduleTableFilterState.sortCol = sName;
        scheduleTableFilterState.sortDir = 'asc'; // 1st click: 선택자 우선 ▲
      } else if (scheduleTableFilterState.sortDir === 'asc') {
        scheduleTableFilterState.sortDir = 'desc'; // 2nd click: 미선택자 우선 ▼
      } else {
        scheduleTableFilterState.sortCol = 'default'; // 3rd click: 기본 순서 ⇅
        scheduleTableFilterState.sortDir = 'asc';
      }
      renderStudentScheduleTable();
    };

    window.handleColHeaderClick = function(colKey) {
      if (scheduleTableFilterState.sortCol !== colKey) {
        scheduleTableFilterState.sortCol = colKey;
        scheduleTableFilterState.sortDir = 'asc';
      } else if (scheduleTableFilterState.sortDir === 'asc') {
        scheduleTableFilterState.sortDir = 'desc';
      } else {
        scheduleTableFilterState.sortCol = 'default';
        scheduleTableFilterState.sortDir = 'asc';
      }
      renderStudentScheduleTable();
    };

    window.resetScheduleTableFilterSort = function() {
      scheduleTableFilterState.search = '';
      scheduleTableFilterState.statusFilter = 'all';
      scheduleTableFilterState.sortCol = 'default';
      scheduleTableFilterState.sortDir = 'asc';
      const searchInput = document.getElementById('step2StudentSearchInput');
      if (searchInput) searchInput.value = '';
      const filterSelect = document.getElementById('step2StatusFilterSelect');
      if (filterSelect) filterSelect.value = 'all';
      renderStudentScheduleTable();
    };

    // Render Student Schedule Table (2-tier Group & Subject Matrix with 100% synchronized row sorting/filtering)
    function renderStudentScheduleTable() {
      const plan = AppState.currentPlan;
      if (!plan || !isPlanValidForCurrentGrade(plan, plan.semester)) return;
      const sem = plan.semester || AppState.currentSemester;

      const { groupCounts, studentAssignments } = analyzeGroupConflicts(plan);
      const searchVal = (document.getElementById('step2StudentSearchInput')?.value || '').trim().toLowerCase();
      const statusVal = document.getElementById('step2StatusFilterSelect')?.value || 'all';
      scheduleTableFilterState.search = searchVal;
      scheduleTableFilterState.statusFilter = statusVal;

      // 1. Filter assignments (entire student row stays intact)
      let filteredAssignments = (studentAssignments || []).filter(asgn => {
        if (searchVal) {
          const matchSearch = String(asgn.name || '').toLowerCase().includes(searchVal) ||
                              String(asgn.classNum || '').includes(searchVal) ||
                              String(asgn.studentNum || '').includes(searchVal) ||
                              String(asgn.career || '').toLowerCase().includes(searchVal);
          if (!matchSearch) return false;
        }

        if (statusVal === 'conflict' && !asgn.hasConflict) return false;
        if (statusVal === 'normal' && asgn.hasConflict) return false;
        if (statusVal === 'manual' && !asgn.isManual) return false;
        if (statusVal === 'modified') {
          const stObj = (AppState.students || []).find(s => s.id === asgn.id);
          if (!stObj || !isStudentChoicesModified(stObj, sem)) return false;
        }
        if (statusVal === 'added') {
          const stObj = (AppState.students || []).find(s => s.id === asgn.id);
          const actChoices = stObj ? getStudentActiveChoices(stObj, sem) : [];
          if (!stObj || (!stObj.isNewlyAdded && actChoices.length > 0)) return false;
        }

        return true;
      });

      // 2. Sort filtered assignments (all columns move in 100% synchronization)
      filteredAssignments.sort((a, b) => {
        const cA = parseInt(String(a.classNum).replace(/[^0-9]/g, ''), 10) || 0;
        const cB = parseInt(String(b.classNum).replace(/[^0-9]/g, ''), 10) || 0;
        const nA = parseInt(String(a.studentNum).replace(/[^0-9]/g, ''), 10) || 0;
        const nB = parseInt(String(b.studentNum).replace(/[^0-9]/g, ''), 10) || 0;
        const fallback = (cA !== cB) ? (cA - cB) : (nA - nB);

        const col = scheduleTableFilterState.sortCol;
        const dir = scheduleTableFilterState.sortDir;

        if (col === 'default') {
          return fallback;
        } else if (col === 'classNum') {
          const diff = (cA - cB);
          return dir === 'asc' ? (diff !== 0 ? diff : fallback) : (diff !== 0 ? -diff : fallback);
        } else if (col === 'studentNum') {
          const diff = (nA - nB);
          return dir === 'asc' ? (diff !== 0 ? diff : fallback) : (diff !== 0 ? -diff : fallback);
        } else if (col === 'name') {
          const diff = String(a.name || '').localeCompare(String(b.name || ''), 'ko');
          return dir === 'asc' ? (diff !== 0 ? diff : fallback) : (diff !== 0 ? -diff : fallback);
        } else if (col === 'career') {
          const diff = String(a.career || '').localeCompare(String(b.career || ''), 'ko');
          return dir === 'asc' ? (diff !== 0 ? diff : fallback) : (diff !== 0 ? -diff : fallback);
        } else if (col === 'status') {
          const diff = (b.hasConflict ? 1 : 0) - (a.hasConflict ? 1 : 0);
          return dir === 'asc' ? (diff !== 0 ? diff : fallback) : (diff !== 0 ? -diff : fallback);
        } else {
          // Subject column sort: col is the subject token name
          const aChosen = Object.values(a.groupSubjects || {}).some(arr => arr.includes(col));
          const bChosen = Object.values(b.groupSubjects || {}).some(arr => arr.includes(col));

          if (aChosen !== bChosen) {
            // dir === 'asc': 선택자 우선 (Chosen first)
            // dir === 'desc': 미선택자 우선 (Unchosen first)
            return dir === 'asc' ? (aChosen ? -1 : 1) : (aChosen ? 1 : -1);
          }
          return fallback;
        }
      });

      // Update Toolbar Sort Badge and Reset Button
      const isFilteredOrSorted = (scheduleTableFilterState.sortCol !== 'default') || 
                                 (scheduleTableFilterState.statusFilter !== 'all') || 
                                 (scheduleTableFilterState.search !== '');
      const badge = document.getElementById('scheduleTableSortBadge');
      const resetBtn = document.getElementById('btnResetTableFilterSort');

      if (badge) {
        if (scheduleTableFilterState.sortCol !== 'default') {
          let colLabel = scheduleTableFilterState.sortCol;
          if (colLabel === 'classNum') colLabel = '반';
          else if (colLabel === 'studentNum') colLabel = '번호';
          else if (colLabel === 'name') colLabel = '이름';
          else if (colLabel === 'career') colLabel = '진로';
          else if (colLabel === 'status') colLabel = '상태';
          const dirLabel = scheduleTableFilterState.sortDir === 'asc' ? '선택자/오름차순 ▲' : '미선택자/내림차순 ▼';
          badge.textContent = `정렬: ${colLabel} (${dirLabel})`;
          badge.classList.remove('hidden');
        } else if (scheduleTableFilterState.statusFilter !== 'all') {
          const filterLabels = { conflict: '충돌 학생만', normal: '정상 학생만', manual: '수동 수정 학생만', modified: '선택 수정된 학생만', added: '추가/미선택 학생만' };
          badge.textContent = `필터: ${filterLabels[scheduleTableFilterState.statusFilter] || ''}`;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }

      if (resetBtn) {
        if (isFilteredOrSorted) {
          resetBtn.classList.remove('hidden');
        } else {
          resetBtn.classList.add('hidden');
        }
      }

      // Update Step 2 Missing Student Count Badge on '➕ 학생 추가' button
      const missingBtnBadge = document.getElementById('step2MissingStudentCountBadge');
      if (missingBtnBadge) {
        const missCnt = (AppState.crossCheckResult && Array.isArray(AppState.crossCheckResult.missingStudents))
          ? AppState.crossCheckResult.missingStudents.length
          : 0;
        if (missCnt > 0) {
          missingBtnBadge.textContent = `미수행 ${missCnt}명`;
          missingBtnBadge.classList.remove('hidden');
        } else {
          missingBtnBadge.classList.add('hidden');
        }
      }

      // Update Step 2 Toolbar Modified Students Badge and Revert All Button
      const modBadge2 = document.getElementById('step2ModifiedBadge');
      const modRevertBtn2 = document.getElementById('btnRevertAllStep2');
      const totalModifiedCount2 = (AppState.students || []).filter(st => isStudentChoicesModified(st, sem)).length;
      if (modBadge2) {
        if (totalModifiedCount2 > 0) {
          modBadge2.textContent = `✏️ 선택 수정: ${totalModifiedCount2}명`;
          modBadge2.classList.remove('hidden');
        } else {
          modBadge2.classList.add('hidden');
        }
      }
      if (modRevertBtn2) {
        if (totalModifiedCount2 > 0) {
          modRevertBtn2.classList.remove('hidden');
        } else {
          modRevertBtn2.classList.add('hidden');
        }
      }

      const getColSortIcon = (colKey) => {
        if (scheduleTableFilterState.sortCol === colKey) {
          return scheduleTableFilterState.sortDir === 'asc' 
            ? ' <span class="text-blue-600 font-black">▲</span>' 
            : ' <span class="text-indigo-600 font-black">▼</span>';
        }
        return ' <span class="text-slate-400 font-normal text-[10px]">⇅</span>';
      };

      const groupThemes = [
        { headerBg: 'bg-blue-100/90 text-blue-950 border-blue-300', numBg: 'bg-blue-600 text-white', thSubjBg: 'bg-blue-50/70 text-blue-900', badgeCls: 'bg-blue-100 text-blue-900 border-blue-300', cellChosenBg: 'bg-blue-50/50' },
        { headerBg: 'bg-emerald-100/90 text-emerald-950 border-emerald-300', numBg: 'bg-emerald-600 text-white', thSubjBg: 'bg-emerald-50/70 text-emerald-900', badgeCls: 'bg-emerald-100 text-emerald-900 border-emerald-300', cellChosenBg: 'bg-emerald-50/50' },
        { headerBg: 'bg-purple-100/90 text-purple-950 border-purple-300', numBg: 'bg-purple-600 text-white', thSubjBg: 'bg-purple-50/70 text-purple-900', badgeCls: 'bg-purple-100 text-purple-900 border-purple-300', cellChosenBg: 'bg-purple-50/50' },
        { headerBg: 'bg-amber-100/90 text-amber-950 border-amber-300', numBg: 'bg-amber-600 text-white', thSubjBg: 'bg-amber-50/70 text-amber-900', badgeCls: 'bg-amber-100 text-amber-900 border-amber-300', cellChosenBg: 'bg-amber-50/50' },
        { headerBg: 'bg-sky-100/90 text-sky-950 border-sky-300', numBg: 'bg-sky-600 text-white', thSubjBg: 'bg-sky-50/70 text-sky-900', badgeCls: 'bg-sky-100 text-sky-900 border-sky-300', cellChosenBg: 'bg-sky-50/50' },
        { headerBg: 'bg-rose-100/90 text-rose-950 border-rose-300', numBg: 'bg-rose-600 text-white', thSubjBg: 'bg-rose-50/70 text-rose-900', badgeCls: 'bg-rose-100 text-rose-900 border-rose-300', cellChosenBg: 'bg-rose-50/50' },
        { headerBg: 'bg-teal-100/90 text-teal-950 border-teal-300', numBg: 'bg-teal-600 text-white', thSubjBg: 'bg-teal-50/70 text-teal-900', badgeCls: 'bg-teal-100 text-teal-900 border-teal-300', cellChosenBg: 'bg-teal-50/50' }
      ];

      // Header Row 1: Groups with colspans and conflict badges (틀고정 sticky top-0)
      let h1 = '<tr class="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 h-[39px]">';
      h1 += `<th rowspan="2" onclick="window.handleColHeaderClick('classNum')" style="position: sticky; top: 0; left: 0px; min-width: 44px; max-width: 44px; z-index: 45;" class="p-2 text-center border-r border-slate-300 bg-slate-100 cursor-pointer hover:bg-slate-200 transition select-none shadow-[1px_0_0_0_#cbd5e1]" title="클릭하여 반 순서 정렬">반${getColSortIcon('classNum')}</th>`;
      h1 += `<th rowspan="2" onclick="window.handleColHeaderClick('studentNum')" style="position: sticky; top: 0; left: 44px; min-width: 44px; max-width: 44px; z-index: 45;" class="p-2 text-center border-r border-slate-300 bg-slate-100 cursor-pointer hover:bg-slate-200 transition select-none shadow-[1px_0_0_0_#cbd5e1]" title="클릭하여 번호 순서 정렬">번호${getColSortIcon('studentNum')}</th>`;
      h1 += `<th rowspan="2" onclick="window.handleColHeaderClick('name')" style="position: sticky; top: 0; left: 88px; min-width: 105px; max-width: 120px; z-index: 45;" class="p-2 text-left border-r-2 border-slate-300 bg-slate-100 cursor-pointer hover:bg-slate-200 transition select-none shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]" title="클릭하여 이름 순서 정렬">이름${getColSortIcon('name')}</th>`;
      h1 += `<th rowspan="2" onclick="window.handleColHeaderClick('career')" style="position: sticky; top: 0; z-index: 35;" class="p-2 text-left border-r-4 border-slate-400 bg-slate-100 min-w-[130px] max-w-[170px] cursor-pointer hover:bg-slate-200 transition select-none" title="클릭하여 진로 순서 정렬">진로·관심${getColSortIcon('career')}</th>`;

      const groupStudentCounts = plan.groups.map((_, gIdx) => {
        let count = 0;
        (studentAssignments || []).forEach(asgn => {
          if ((asgn.groupSubjects[gIdx] || []).length > 0) {
            count++;
          }
        });
        return count;
      });

      plan.groups.forEach((groupSubjs, gIdx) => {
        const colCount = Math.max(groupSubjs.length, 1);
        const gConf = groupCounts[gIdx];
        const theme = groupThemes[gIdx % groupThemes.length];
        const confBadge = gConf === 0
          ? '<span class="ml-1.5 text-[10px] font-semibold text-emerald-800 bg-white/95 px-1.5 py-0.2 rounded-full border border-emerald-300 shadow-2xs">중복 0</span>'
          : `<span class="ml-1.5 text-[10px] font-black text-rose-800 bg-white/95 px-1.5 py-0.2 rounded-full border border-rose-300 shadow-2xs animate-pulse">중복 ${gConf}명</span>`;

        h1 += `<th colspan="${colCount}" style="position: sticky; top: 0; z-index: 35;" class="p-2 text-center border-r-4 border-slate-400 font-extrabold ${theme.headerBg}">
          <div class="flex items-center justify-center gap-1.5">
            <span class="w-5 h-5 rounded-md ${theme.numBg} text-[11px] font-black flex items-center justify-center shadow-2xs">${gIdx + 1}</span>
            <span class="text-xs font-black tracking-wide">${gIdx + 1}그룹(${groupStudentCounts[gIdx]}명)</span>
            ${confBadge}
          </div>
        </th>`;
      });

      h1 += `<th rowspan="2" onclick="window.handleColHeaderClick('status')" style="position: sticky; top: 0; z-index: 35;" class="p-2 text-center bg-slate-100 min-w-[90px] border-l-4 border-slate-400 cursor-pointer hover:bg-slate-200 transition select-none font-bold" title="클릭하여 충돌/정상 상태 정렬">
        선택 상태${getColSortIcon('status')}
      </th>`;
      h1 += `<th rowspan="2" style="position: sticky; top: 0; z-index: 35;" class="p-2 text-center bg-slate-100 min-w-[220px] border-l-2 border-slate-300 font-bold whitespace-nowrap select-none" title="다른 선택과목 변경 추천 또는 상담 특이사항 메모">
        과목 변경 추천 / 상담 메모
      </th>`;
      h1 += '</tr>';

      // Header Row 2: Subjects under each group (과목명 틀고정 sticky top-[39px])
      let h2 = '<tr class="bg-slate-50 text-slate-800 font-bold border-b-2 border-slate-400 text-[11px] h-[37px]">';
      plan.groups.forEach((groupSubjs, gIdx) => {
        const theme = groupThemes[gIdx % groupThemes.length];
        if (groupSubjs.length === 0) {
          h2 += `<th style="position: sticky; top: 39px; z-index: 30;" class="p-2 text-center border-r-4 border-slate-400 text-slate-400 italic ${theme.thSubjBg}">과목 없음</th>`;
        } else {
          groupSubjs.forEach((sName, sIdx) => {
            const isLastInGroup = sIdx === groupSubjs.length - 1;
            const borderCls = isLastInGroup ? 'border-r-4 border-slate-400' : 'border-r border-slate-300';
            const isSorted = scheduleTableFilterState.sortCol === sName;
            const isSelectedForSwap = subjectSwapState.active && subjectSwapState.selectedSubject === sName;

            let sortIndicator = '<span class="text-slate-400 font-normal text-[10px] ml-0.5 opacity-60 hover:opacity-100">⇅</span>';
            let thBg = theme.thSubjBg;
            let thTitle = '';

            if (isSelectedForSwap) {
              thBg = 'bg-amber-200 text-amber-950 ring-4 ring-amber-400 font-black shadow-md z-30 animate-pulse';
              thTitle = `[${sName}] 1차 선택됨 (다시 클릭 시 취소, 다른 과목 클릭 시 맞교환)`;
            } else if (subjectSwapState.active) {
              thBg += ' hover:bg-amber-100 hover:ring-2 hover:ring-amber-400 cursor-pointer';
              thTitle = subjectSwapState.selectedSubject 
                ? `클릭 시 [${subjectSwapState.selectedSubject}] 과(와) [${sName}] 위치 맞교환`
                : `클릭하여 [${sName}] 1차 선택`;
            } else if (isSorted) {
              if (scheduleTableFilterState.sortDir === 'asc') {
                sortIndicator = '<span class="ml-1 px-1.5 py-0.2 rounded-md bg-blue-600 text-white font-extrabold text-[10px] shadow-2xs">▲선택</span>';
              } else {
                sortIndicator = '<span class="ml-1 px-1.5 py-0.2 rounded-md bg-indigo-600 text-white font-extrabold text-[10px] shadow-2xs">▼미선택</span>';
              }
              thBg = 'bg-blue-100 text-blue-950 ring-2 ring-inset ring-blue-500 font-black';
              thTitle = `클릭: [${sName}] 선택자 우선 ▲ → 미선택자 우선 ▼ → 기본 순서 ⇅`;
            } else {
              thTitle = `클릭: [${sName}] 선택 학생 정렬 (우측 ⇄ 클릭 시 위치 맞교환)`;
            }

            const parentName = sName.replace(/-[A-Z]$/, '');
            const isSubjPinned = (AppState.pinnedSubjects?.[sem]?.[parentName] === gIdx + 1);
            const pinIconHtml = isSubjPinned 
              ? `<button type="button" onclick="event.stopPropagation(); window.toggleSubjectPin('${parentName}', ${gIdx});" class="p-0.5 rounded text-[11px] text-blue-600 hover:bg-blue-100 transition mr-0.5" title="[${parentName}] ${gIdx + 1}그룹 고정됨 (클릭 시 고정 해제)">📌</button>` 
              : '';

            const swapBtnHtml = `<button type="button" onclick="event.stopPropagation(); window.startSubjectSwap('${sName}', ${gIdx});" class="p-0.5 px-1 rounded text-[10px] font-black text-slate-400 hover:text-amber-900 hover:bg-amber-200/90 transition ml-1" title="[${sName}] 위치 맞교환 선택">⇄</button>`;

            const selectedBadge = isSelectedForSwap 
              ? '<span class="bg-amber-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black animate-bounce mr-1">1차선택</span>' 
              : '';

            h2 += `<th onclick="window.handleSubjectHeaderClick('${sName}', ${gIdx})" 
                      style="position: sticky; top: 39px; z-index: 30;"
                      class="p-2 text-center ${borderCls} ${thBg} whitespace-nowrap min-w-[82px] cursor-pointer select-none transition-all shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1)]" 
                      title="${thTitle}">
              <div class="flex items-center justify-center gap-0.5">
                ${selectedBadge}
                ${pinIconHtml}
                <span class="font-bold">${sName}</span>
                ${sortIndicator}
                ${swapBtnHtml}
              </div>
            </th>`;
          });
        }
      });
      h2 += '</tr>';

      let thead = `<thead>${h1}${h2}</thead>`;

      // Table Body Rows
      let tbody = '<tbody class="divide-y divide-slate-200 text-slate-700">';

      if (filteredAssignments.length === 0) {
        tbody += `<tr><td colspan="100%" class="p-8 text-center text-slate-400 italic bg-white">
          일치하는 학생이 없습니다. 검색어 또는 필터 조건을 확인해보세요.
        </td></tr>`;
      } else {
        filteredAssignments.forEach((asgn, idx) => {
          const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';
          const overlaps = asgn.groupSubjects || {};
          let hasAnyConflict = false;
          const conflictGroups = [];

          plan.groups.forEach((_, gIdx) => {
            if ((overlaps[gIdx] || []).length > 1) {
              hasAnyConflict = true;
              conflictGroups.push(`${gIdx + 1}그룹`);
            }
          });

          const st = (AppState.students || []).find(s => s.id === asgn.id);
          const origList = st ? getStudentOriginalChoices(st, sem) : [];
          const activeList = st ? getStudentActiveChoices(st, sem) : [];
          const isModified = st ? isStudentChoicesModified(st, sem) : false;

          const dupSt = (AppState.crossCheckResult && AppState.crossCheckResult.duplicateEnrollments)
            ? AppState.crossCheckResult.duplicateEnrollments.find(d => 
                String(d.classNum).replace(/[^0-9]/g, '') === String(asgn.classNum).replace(/[^0-9]/g, '') &&
                d.name.trim() === asgn.name.trim()
              )
            : null;
          const dupItemsThisSem = dupSt ? (dupSt.dupList || []).filter(d => d.semester === sem) : [];

          tbody += `<tr id="step2-student-row-${asgn.id}" class="${rowBg} hover:bg-indigo-50/50 transition-colors">`;
          tbody += `<td style="position: sticky; left: 0px; min-width: 44px; max-width: 44px; z-index: 10;" class="p-2 text-center border-r border-slate-200 font-medium ${rowBg} shadow-[1px_0_0_0_#e2e8f0]">${asgn.classNum}</td>`;
          tbody += `<td style="position: sticky; left: 44px; min-width: 44px; max-width: 44px; z-index: 10;" class="p-2 text-center border-r border-slate-200 font-medium ${rowBg} shadow-[1px_0_0_0_#e2e8f0]">${asgn.studentNum}</td>`;
          tbody += `<td style="position: sticky; left: 88px; min-width: 115px; max-width: 135px; z-index: 10;" class="p-2 border-r-2 border-slate-300 whitespace-nowrap ${rowBg} shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
            <div class="flex items-center justify-between gap-1">
              <span class="font-bold text-slate-900">${asgn.name}</span>
              <div class="flex items-center gap-0.5 shrink-0">
                ${st && st.isNewlyAdded ? `
                  <span class="px-1 py-0.2 rounded text-[9px] bg-indigo-100 text-indigo-800 font-black border border-indigo-300 shadow-2xs" title="미수행자 명단 또는 임의 추가로 등록된 학생">추가</span>
                ` : ''}
                ${isModified ? `
                  <span class="px-1 py-0.2 rounded text-[9px] bg-amber-100 text-amber-800 font-black border border-amber-300 shadow-2xs" title="선택 과목 변경됨">수정</span>
                  <button type="button" onclick="event.stopPropagation(); window.revertStudentChoices('${asgn.id}', ${sem});" class="text-blue-600 hover:text-blue-800 text-[10px] underline font-semibold cursor-pointer" title="이 학생 원래 선택으로 복원">↩</button>
                ` : ''}
                <button type="button" onclick="event.stopPropagation(); window.openStudentChoiceEditModal('${asgn.id}', ${sem});" class="p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition text-[10px] cursor-pointer" title="학생 수강 과목 수정">✏️</button>
                ${st && st.isNewlyAdded ? `
                  <button type="button" onclick="event.stopPropagation(); window.deleteAddedStudent('${asgn.id}');" class="p-0.5 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition text-[10px] cursor-pointer" title="추가한 학생 삭제">🗑️</button>
                ` : ''}
              </div>
            </div>
          </td>`;
          tbody += `<td class="p-2 text-slate-600 border-r-4 border-slate-400 text-[11px] truncate min-w-[130px] max-w-[170px]" title="${asgn.career}">${asgn.career}</td>`;

          // Render cells under each group and subject
          plan.groups.forEach((groupSubjs, gIdx) => {
            const theme = groupThemes[gIdx % groupThemes.length];
            const chosenInGrp = overlaps[gIdx] || [];
            const isGroupConflicted = chosenInGrp.length > 1;

            if (groupSubjs.length === 0) {
              tbody += '<td class="p-2 text-center border-r-4 border-slate-400 text-slate-300">-</td>';
            } else {
              groupSubjs.forEach((sName, sIdx) => {
                const isLast = sIdx === groupSubjs.length - 1;
                const borderCls = isLast ? 'border-r-4 border-slate-400' : 'border-r border-slate-300';
                const isChosen = chosenInGrp.includes(sName);
                const isColSelectedForSwap = subjectSwapState.active && subjectSwapState.selectedSubject === sName;
                const swapColBg = isColSelectedForSwap ? 'bg-amber-100/40' : '';
                const parentName = sName.replace(/-[A-Z]$/, '');
                const normParent = normalizeSubject(parentName);
                const wasOrig = origList.some(s => normalizeSubject(s) === normParent);
                const isAct = activeList.some(s => normalizeSubject(s) === normParent);
                const safeParent = parentName.replace(/'/g, "\\'");

                if (isChosen) {
                  const isNewlyAdded = !wasOrig && isAct;
                  const matchedDups = dupItemsThisSem.filter(d => d.normalized === normParent);
                  const isDupEnroll = matchedDups.length > 0;
                  const dupLabelText = isDupEnroll ? Array.from(new Set(matchedDups.map(d => d.sourceLabel))).join(', ') : '';
                  const dupBadgeHtml = isDupEnroll ? `<span class="ml-1 px-1 py-0.2 rounded text-[9px] bg-amber-500 text-white font-black shrink-0" title="⚠️ ${dupLabelText}">⚠️중복</span>` : '';
                  const dupTitleSuffix = isDupEnroll ? ` | ⚠️ ${dupLabelText}` : '';

                  if (isGroupConflicted) {
                    tbody += `<td class="p-1.5 text-center ${borderCls} ${isColSelectedForSwap ? 'bg-amber-100/80' : 'bg-rose-50'}">
                      <div onclick="window.toggleStudentSubjectSelection('${asgn.id}', '${safeParent}', ${sem});" class="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-lg font-black text-[11px] bg-rose-100 text-rose-800 border-2 border-rose-300 shadow-2xs animate-pulse truncate max-w-[130px] cursor-pointer hover:bg-rose-200 transition" title="⚠️ 동일 그룹 중복 충돌: ${sName} ${isNewlyAdded ? '(수정됨)' : ''}${dupTitleSuffix} (클릭 시 수강 취소)">
                        <span>⚠️ ${sName}</span>${isNewlyAdded ? '<span class="ml-1 px-1 py-0.2 rounded text-[9px] bg-amber-600 text-white font-black shrink-0">수정</span>' : ''}${dupBadgeHtml}
                      </div>
                    </td>`;
                  } else if (isNewlyAdded) {
                    tbody += `<td class="p-1.5 text-center ${borderCls} ${isColSelectedForSwap ? 'bg-amber-100/60' : (isDupEnroll ? 'bg-amber-50/80' : 'bg-emerald-50/70')}">
                      <div onclick="window.toggleStudentSubjectSelection('${asgn.id}', '${safeParent}', ${sem});" class="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-lg font-extrabold text-[11px] ${isDupEnroll ? 'bg-amber-100 text-amber-950 border-2 border-amber-400 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400 hover:bg-emerald-200'} shadow-2xs transition cursor-pointer truncate max-w-[130px]" title="[${parentName}] 사용자가 수동 선택/수정함${dupTitleSuffix} (클릭 시 취소)">
                        <span>${sName}</span><span class="ml-1 px-1 py-0.2 rounded text-[9px] bg-emerald-600 text-white font-black shrink-0">수정</span>${dupBadgeHtml}
                      </div>
                    </td>`;
                  } else {
                    tbody += `<td class="p-1.5 text-center ${borderCls} ${isColSelectedForSwap ? 'bg-amber-100/60' : (isDupEnroll ? 'bg-amber-50/70' : theme.cellChosenBg)}">
                      <div onclick="window.toggleStudentSubjectSelection('${asgn.id}', '${safeParent}', ${sem});" class="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-lg font-bold text-[11px] ${isDupEnroll ? 'bg-amber-100 text-amber-900 border border-amber-400' : theme.badgeCls} shadow-2xs hover:scale-105 hover:bg-blue-200 transition cursor-pointer truncate max-w-[125px]" title="${sName} 배정됨${dupTitleSuffix} (클릭 시 선택 취소/제외)">
                        <span>${sName}</span>${dupBadgeHtml}
                      </div>
                    </td>`;
                  }
                } else {
                  if (wasOrig && !isAct) {
                    // The student originally took parentName, but cancelled it!
                    tbody += `<td class="p-1.5 text-center ${borderCls} bg-rose-50/50 hover:bg-rose-100 transition cursor-pointer" onclick="window.toggleStudentSubjectSelection('${asgn.id}', '${safeParent}', ${sem});" title="[${parentName}] 원래 선택했으나 취소됨 (집계 제외) - 클릭 시 원본 복원">
                      <div class="inline-flex items-center justify-center px-1.5 py-0.5 rounded font-semibold text-[10px] text-rose-600 bg-rose-100/90 border border-dashed border-rose-300 opacity-90 truncate max-w-[105px]">
                        <span class="line-through decoration-rose-600 decoration-1">✕ ${sName}</span>
                      </div>
                    </td>`;
                  } else {
                    tbody += `<td class="p-1.5 text-center ${borderCls} ${swapColBg} hover:bg-blue-50/50 transition cursor-pointer group" onclick="window.toggleStudentSubjectSelection('${asgn.id}', '${safeParent}', ${sem});" title="클릭하여 [${parentName}] 추가">
                      <span class="text-slate-300 group-hover:text-blue-600 font-bold text-xs select-none">·</span>
                    </td>`;
                  }
                }
              });
            }
          });

          // Status cell
          const dupSemSummary = dupItemsThisSem.length > 0
            ? Array.from(new Set(dupItemsThisSem.map(d => `${d.subject}(${d.sourceLabel})`))).join(', ')
            : '';
          tbody += `<td class="p-1.5 text-center text-[11px] border-l-4 border-slate-400 whitespace-nowrap">`;
          tbody += `<div class="flex items-center justify-center gap-1.5">`;
          if (activeList.length === 0) {
            tbody += `<span onclick="window.openStudentChoiceEditModal('${asgn.id}', ${sem})" class="px-2.5 py-0.5 rounded-lg font-extrabold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 shadow-2xs cursor-pointer transition" title="아직 선택된 과목이 없습니다. 클릭하거나 왼쪽 과목 셀(·)을 눌러 과목을 선택하세요.">📝 과목 미선택 (입력)</span>`;
          } else if (hasAnyConflict || asgn.hasConflict) {
            tbody += `<span class="px-2 py-0.5 rounded-lg font-extrabold text-rose-800 bg-rose-100 border border-rose-300 shadow-2xs flex items-center gap-1">
              <span>⚠️ 중복</span><span class="text-[10px] font-semibold text-rose-700">(${conflictGroups.join(', ')})</span>
            </span>`;
          } else {
            tbody += `<span class="px-2.5 py-0.5 rounded-lg font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 shadow-2xs">✅ 정상 배정</span>`;
          }
          if (dupSemSummary) {
            tbody += `<span class="px-2 py-0.5 rounded-lg font-extrabold text-amber-900 bg-amber-100 border border-amber-400 shadow-2xs flex items-center gap-1" title="⚠️ 중복수강 의심: ${escapeHtml(dupSemSummary)}">
              <span>⚠️ 중복수강</span>
            </span>`;
          }
          tbody += `</div></td>`;

          // Recommendation / Consultation Memo Cell
          const studentNote = (plan.studentRecommendations && plan.studentRecommendations[asgn.id]) || '';
          tbody += `<td class="p-1.5 border-l-2 border-slate-300 min-w-[220px] bg-white">
            <input type="text" 
                   value="${escapeHtml(studentNote)}" 
                   placeholder="추천 과목 / 메모..." 
                   class="w-full text-xs px-2.5 py-1 border border-slate-200 hover:border-slate-400 focus:border-blue-500 rounded bg-white focus:bg-amber-50/40 outline-none transition placeholder:text-slate-300 font-normal" 
                   oninput="window.handleStudentScheduleNoteChange('${asgn.id}', this.value)" 
                   title="학생별 과목 변경 추천 또는 상담 메모" />
          </td>`;

          tbody += '</tr>';
        });
      }

      // Compute subject counts across all students in current plan
      const subjCounts = {};
      plan.groups.forEach(groupSubjs => {
        groupSubjs.forEach(sName => {
          subjCounts[sName] = 0;
        });
      });
      (studentAssignments || []).forEach(asgn => {
        const overlaps = asgn.groupSubjects || {};
        plan.groups.forEach((groupSubjs, gIdx) => {
          const inGrp = overlaps[gIdx] || [];
          inGrp.forEach(sName => {
            if (subjCounts[sName] !== undefined) {
              subjCounts[sName]++;
            }
          });
        });
      });

      // Spacer Row (1행 띄움)
      tbody += '<tr class="h-4 bg-slate-100/80"><td colspan="100%" class="border-y-2 border-slate-300"></td></tr>';

      // 1. Subject Totals Row (과목별 학생수 합계: N명)
      tbody += '<tr class="bg-blue-50/60 font-bold text-slate-800 border-b border-slate-300">';
      tbody += `<td style="position: sticky; left: 0px; z-index: 10;" class="p-2 border-r border-slate-200 bg-blue-50/90"></td>`;
      tbody += `<td style="position: sticky; left: 44px; z-index: 10;" class="p-2 border-r border-slate-200 bg-blue-50/90"></td>`;
      tbody += `<td style="position: sticky; left: 88px; z-index: 10;" class="p-2 border-r-2 border-slate-300 font-extrabold text-blue-950 bg-blue-50/95 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">과목별 합계</td>`;
      tbody += '<td class="p-2 border-r-4 border-slate-400 text-slate-500 font-normal text-[11px] bg-blue-50/60">선택 학생수</td>';

      plan.groups.forEach((groupSubjs, gIdx) => {
        const theme = groupThemes[gIdx % groupThemes.length];
        if (groupSubjs.length === 0) {
          tbody += '<td class="p-2 text-center border-r-4 border-slate-400 font-bold text-slate-400">-</td>';
        } else {
          groupSubjs.forEach((sName, sIdx) => {
            const isLast = sIdx === groupSubjs.length - 1;
            const borderCls = isLast ? 'border-r-4 border-slate-400' : 'border-r border-slate-300';
            const count = subjCounts[sName] || 0;
            tbody += `<td class="p-2 text-center ${borderCls} ${theme.thSubjBg}">
              <span class="inline-block px-2 py-0.5 rounded-md font-extrabold text-blue-900 bg-white border border-blue-200 shadow-2xs text-[11px]">${count}명</span>
            </td>`;
          });
        }
      });
      tbody += '<td class="p-2 border-l-4 border-slate-400 bg-blue-50/60"></td><td class="p-2 border-l-2 border-slate-300 bg-blue-50/60"></td>';
      tbody += '</tr>';

      // 2. Group Totals Row (그룹별 학생수 합계: 각 그룹의 첫 번째 과목 위치에 N명)
      tbody += '<tr class="bg-indigo-50/70 font-black text-slate-900 border-b-2 border-slate-400">';
      tbody += `<td style="position: sticky; left: 0px; z-index: 10;" class="p-2.5 border-r border-slate-200 bg-indigo-50/90"></td>`;
      tbody += `<td style="position: sticky; left: 44px; z-index: 10;" class="p-2.5 border-r border-slate-200 bg-indigo-50/90"></td>`;
      tbody += `<td style="position: sticky; left: 88px; z-index: 10;" class="p-2.5 border-r-2 border-slate-300 font-black text-indigo-950 bg-indigo-50/95 whitespace-nowrap shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">그룹별 총원</td>`;
      tbody += '<td class="p-2.5 border-r-4 border-slate-400 text-slate-600 font-bold text-[11px] bg-indigo-50/70">교시별 총수강</td>';

      plan.groups.forEach((groupSubjs, gIdx) => {
        const groupTotal = groupSubjs.reduce((acc, sName) => acc + (subjCounts[sName] || 0), 0);
        if (groupSubjs.length === 0) {
          tbody += `<td class="p-2.5 text-center border-r-4 border-slate-400 font-black text-indigo-900 bg-indigo-100 text-[12px]"><span class="px-2 py-0.5 rounded bg-indigo-600 text-white shadow-2xs">총 ${groupTotal}명</span></td>`;
        } else {
          groupSubjs.forEach((sName, sIdx) => {
            const isLast = sIdx === groupSubjs.length - 1;
            const borderCls = isLast ? 'border-r-4 border-slate-400' : 'border-r border-slate-300';
            if (sIdx === 0) {
              tbody += `<td class="p-2.5 text-center ${borderCls} font-black bg-indigo-100/80 text-[12px]">
                <span class="inline-block px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white shadow-2xs font-extrabold whitespace-nowrap">총 ${groupTotal}명</span>
              </td>`;
            } else {
              tbody += `<td class="p-2.5 text-center ${borderCls} bg-indigo-50/30"></td>`;
            }
          });
        }
      });
      tbody += '<td class="p-2.5 border-l-4 border-slate-400 bg-indigo-50/70"></td><td class="p-2.5 border-l-2 border-slate-300 bg-indigo-50/70"></td>';
      tbody += '</tr>';

      tbody += '</tbody>';

      const tbl = document.getElementById('studentScheduleTable');
      if (tbl) tbl.innerHTML = thead + tbody;

      // Sync Bottom Work Memo
      const memoTextarea = document.getElementById('planWorkMemo');
      if (memoTextarea) {
        memoTextarea.value = plan.memo || '';
      }
    }

    window.handleStudentScheduleNoteChange = function(studentId, note) {
      const plan = AppState.currentPlan;
      if (!plan) return;
      if (!plan.studentRecommendations) plan.studentRecommendations = {};
      plan.studentRecommendations[studentId] = note;

      // Sync to matching savedPlan if active plan is linked
      const match = AppState.savedPlans.find(p => p.id === plan.id);
      if (match) {
        if (!match.studentRecommendations) match.studentRecommendations = {};
        match.studentRecommendations[studentId] = note;
      }
      saveAllState();
    };

    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // ==========================================
    // Toolbar & Filter Event Listeners
    document.getElementById('step2StudentSearchInput')?.addEventListener('input', renderStudentScheduleTable);
    document.getElementById('step2StatusFilterSelect')?.addEventListener('change', renderStudentScheduleTable);
    document.getElementById('btnResetTableFilterSort')?.addEventListener('click', window.resetScheduleTableFilterSort);
    document.getElementById('btnToggleSubjectSwap')?.addEventListener('click', () => window.toggleSubjectSwapMode());
    document.getElementById('btnExitSwapMode')?.addEventListener('click', () => window.toggleSubjectSwapMode(false));
    document.getElementById('btnUndoSubjectSwap')?.addEventListener('click', () => window.undoSubjectSwap());

    // Bottom Work Memo Event Listeners
    const memoTextarea = document.getElementById('planWorkMemo');
    const btnSaveMemo = document.getElementById('btnSavePlanMemo');
    const memoSavedHint = document.getElementById('planMemoSavedHint');

    function saveCurrentWorkMemo() {
      if (!AppState.currentPlan) return;
      const val = memoTextarea ? memoTextarea.value : '';
      AppState.currentPlan.memo = val;
      const match = AppState.savedPlans.find(p => p.id === AppState.currentPlan.id);
      if (match) {
        match.memo = val;
        const savedTa = document.querySelector(`textarea[data-plan-id="${match.id}"]`);
        if (savedTa && savedTa.value !== val) {
          savedTa.value = val;
        }
      }
      saveAllState();
      if (memoSavedHint) {
        memoSavedHint.classList.remove('hidden');
        setTimeout(() => memoSavedHint.classList.add('hidden'), 2500);
      }
    }

    memoTextarea?.addEventListener('input', () => {
      if (AppState.currentPlan && memoTextarea) {
        const val = memoTextarea.value;
        AppState.currentPlan.memo = val;
        const match = AppState.savedPlans.find(p => p.id === AppState.currentPlan.id);
        if (match) {
          match.memo = val;
          const savedTa = document.querySelector(`textarea[data-plan-id="${match.id}"]`);
          if (savedTa && savedTa.value !== val) {
            savedTa.value = val;
          }
        }
      }
    });
    memoTextarea?.addEventListener('blur', saveCurrentWorkMemo);
    btnSaveMemo?.addEventListener('click', () => {
      saveCurrentWorkMemo();
      btnSavePlan?.click();
    });

    window.handleSavedPlanMemoChange = function(planId, text) {
      const plan = AppState.savedPlans.find(p => p.id === planId || String(p.id) === String(planId));
      if (plan) {
        plan.memo = text;
        if (AppState.currentPlan && (AppState.currentPlan.id === planId || String(AppState.currentPlan.id) === String(planId))) {
          AppState.currentPlan.memo = text;
          const memoTextarea = document.getElementById('planWorkMemo');
          if (memoTextarea && memoTextarea.value !== text) {
            memoTextarea.value = text;
          }
        }
        saveAllState();
      }
    };

    // ==========================================
    // 6. SAVING PLANS & COMBINED EXCEL DOWNLOAD
    // ==========================================

    btnSavePlan.addEventListener('click', () => {
      if (!AppState.currentPlan) {
        alert('저장할 현재 배치안이 없습니다. 먼저 그룹핑 시뮬레이션을 실행해주세요.');
        return;
      }
      const memoTextarea = document.getElementById('planWorkMemo');
      if (memoTextarea && AppState.currentPlan) {
        AppState.currentPlan.memo = memoTextarea.value;
      }
      const sem = AppState.currentPlan.semester;
      const count = AppState.savedPlans.filter(p => p.semester === sem).length + 1;
      const planName = `${sem}학기 ${count}안 (충돌 ${AppState.currentPlan.conflictCount}명)`;

      const { groupCounts, studentGroupOverlaps } = analyzeGroupConflicts(AppState.currentPlan);

      const newSavedPlan = {
        id: Date.now(),
        name: planName,
        semester: sem,
        groupCount: AppState.currentPlan.groups.length,
        groups: JSON.parse(JSON.stringify(AppState.currentPlan.groups)),
        conflictCount: AppState.currentPlan.conflictCount,
        conflicts: JSON.parse(JSON.stringify(AppState.currentPlan.conflicts)),
        groupCounts: JSON.parse(JSON.stringify(groupCounts)),
        studentGroupOverlaps: JSON.parse(JSON.stringify(studentGroupOverlaps)),
        customAssignments: JSON.parse(JSON.stringify(AppState.currentPlan.customAssignments || {})),
        memo: AppState.currentPlan.memo || '',
        studentRecommendations: JSON.parse(JSON.stringify(AppState.currentPlan.studentRecommendations || {})),
        confirmed: false,
        splitConfig: JSON.parse(JSON.stringify(AppState.splitSubjects[sem] || {})),
        pinnedConfig: JSON.parse(JSON.stringify(AppState.pinnedSubjects[sem] || {})),
        lockedConfig: JSON.parse(JSON.stringify(AppState.lockedGroups?.[sem] || {})),
        togetherConfig: JSON.parse(JSON.stringify(AppState.togetherPairs?.[sem] || [])),
        separateConfig: JSON.parse(JSON.stringify(AppState.separatePairs?.[sem] || [])),
        timestamp: new Date().toLocaleTimeString()
      };

      AppState.savedPlans.push(newSavedPlan);
      savedPlansActiveTab = sem;
      renderSavedPlansList();

      // [요구사항 반영] 배치안 저장 완료 후 시간표 작업 메모란 빈칸으로 초기화
      if (memoTextarea) {
        memoTextarea.value = '';
      }
      if (AppState.currentPlan) {
        AppState.currentPlan.memo = '';
        AppState.currentPlan.id = null;
      }
      const memoSavedHint = document.getElementById('planMemoSavedHint');
      if (memoSavedHint) memoSavedHint.classList.add('hidden');

      saveAllState();
      alert(`⭐ [${planName}]이 저장되었습니다!\n아래 '저장된 그룹핑 후보안 목록'에서 개별 메모 작성, 다운로드 및 시간표 확인이 가능합니다.`);
    });

    window.togglePlanConfirmed = function(planId) {
      const plan = AppState.savedPlans.find(p => p.id === planId || String(p.id) === String(planId));
      if (plan) {
        plan.confirmed = !plan.confirmed;
        renderSavedPlansList();
        saveAllState();
      }
    };

    // Saved Plans Tab State (1, 2, or 'all')
    let savedPlansActiveTab = 1;

    window.switchSavedPlansTab = function(tab) {
      savedPlansActiveTab = tab;
      renderSavedPlansList();
    };

    function renderSavedPlansList() {
      const allPlans = AppState.savedPlans || [];
      const sem1Plans = allPlans.filter(p => p.semester === 1);
      const sem2Plans = allPlans.filter(p => p.semester === 2);

      // Update badge counts
      const c1 = document.getElementById('savedPlansSem1Count');
      const c2 = document.getElementById('savedPlansSem2Count');
      const cAll = document.getElementById('savedPlansAllCount');
      if (c1) c1.textContent = sem1Plans.length;
      if (c2) c2.textContent = sem2Plans.length;
      if (cAll) cAll.textContent = allPlans.length;

      if (statSavedPlansCount) {
        statSavedPlansCount.textContent = `${allPlans.length}개`;
      }

      // Update tab button styles
      const btn1 = document.getElementById('savedPlansSem1Btn');
      const btn2 = document.getElementById('savedPlansSem2Btn');
      const btnAll = document.getElementById('savedPlansAllBtn');

      const activeBtnCls = 'px-3 py-1 text-xs font-bold rounded-md bg-white text-blue-700 shadow-2xs transition-all cursor-pointer';
      const inactiveBtnCls = 'px-3 py-1 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 transition-all cursor-pointer';

      if (btn1) btn1.className = (savedPlansActiveTab === 1 || savedPlansActiveTab === '1') ? activeBtnCls : inactiveBtnCls;
      if (btn2) btn2.className = (savedPlansActiveTab === 2 || savedPlansActiveTab === '2') ? activeBtnCls : inactiveBtnCls;
      if (btnAll) btnAll.className = (savedPlansActiveTab === 'all') ? activeBtnCls : inactiveBtnCls;

      // Filter plans by active tab
      let displayPlans = allPlans;
      let emptyMsg = '아직 저장된 안이 없습니다. 상단의 "현재 배치 저장" 버튼을 눌러보세요.';

      if (savedPlansActiveTab === 1 || savedPlansActiveTab === '1') {
        displayPlans = sem1Plans;
        emptyMsg = '1학기에 저장된 안이 없습니다. 상단의 "현재 배치 저장" 버튼을 눌러보세요.';
      } else if (savedPlansActiveTab === 2 || savedPlansActiveTab === '2') {
        displayPlans = sem2Plans;
        emptyMsg = '2학기에 저장된 안이 없습니다. 상단의 "현재 배치 저장" 버튼을 눌러보세요.';
      }

      if (displayPlans.length === 0) {
        savedPlansList.innerHTML = `<p class="text-xs text-slate-400 italic py-2">${emptyMsg}</p>`;
        return;
      }

      savedPlansList.innerHTML = displayPlans.map((plan, idx) => {
        const isConfirmed = Boolean(plan.confirmed);
        const cardStyle = isConfirmed 
          ? 'w-full bg-amber-50/85 border-2 border-amber-400 ring-2 ring-amber-300/50 rounded-xl p-4 shadow-md space-y-3 transition-all'
          : 'w-full bg-white border-2 border-slate-200 hover:border-blue-400 rounded-xl p-4 shadow-sm space-y-3 transition-all';

        const numBadgeStyle = isConfirmed
          ? 'w-6 h-6 rounded-md bg-amber-500 text-amber-950 font-black text-xs flex items-center justify-center shadow-xs'
          : 'w-6 h-6 rounded-md bg-indigo-600 text-white font-black text-xs flex items-center justify-center';

        const confirmBtnClass = isConfirmed
          ? 'px-2.5 py-1 text-xs font-bold rounded-lg border border-amber-500 bg-amber-400 hover:bg-amber-500 text-amber-950 transition shadow-2xs flex items-center gap-1 cursor-pointer'
          : 'px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 transition shadow-2xs flex items-center gap-1 cursor-pointer';

        return `
        <div class="${cardStyle}">
          <div class="flex flex-wrap items-center justify-between border-b ${isConfirmed ? 'border-amber-200' : 'border-slate-100'} pb-2 gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="${numBadgeStyle}">${idx + 1}</span>
              <h5 class="text-sm font-bold text-slate-900">${plan.name}</h5>
              ${plan.conflictCount === 0 
                ? '<span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">충돌 0명 (최적)</span>' 
                : `<span class="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full border border-rose-300">충돌 ${plan.conflictCount}명</span>`}
              
              <!-- 확인 (중요안 지정 버튼) -->
              <button type="button" 
                      onclick="window.togglePlanConfirmed('${plan.id}')" 
                      class="${confirmBtnClass}"
                      title="${isConfirmed ? '클릭 시 중요 표시 해제' : '중요하게 생각하는 안으로 확인 표시 (노란색 강조)'}">
                <span>${isConfirmed ? '⭐ 확인됨' : '확인'}</span>
              </button>
            </div>
            <span class="text-[11px] ${isConfirmed ? 'text-amber-800 font-semibold' : 'text-slate-400 font-medium'}">저장 시각: ${plan.timestamp}</span>
          </div>

          <!-- Group Structure Preview -->
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
            ${plan.groups.map((gSubjs, gIdx) => `
              <div class="${isConfirmed ? 'bg-amber-100/70 border-amber-300' : 'bg-slate-50 border-slate-200'} p-2 rounded-lg border transition">
                <div class="font-bold ${isConfirmed ? 'text-amber-950 border-amber-300' : 'text-slate-800 border-slate-200'} border-b pb-1 mb-1 text-[11px] flex justify-between items-center">
                  <span>${gIdx + 1}그룹</span>
                  <span class="${isConfirmed ? 'text-amber-700' : 'text-slate-400'} text-[10px]">(${gSubjs.length}과목)</span>
                </div>
                <div class="text-[11px] ${isConfirmed ? 'text-amber-900' : 'text-slate-600'} space-y-0.5 truncate" title="${gSubjs.join(', ')}">
                  ${gSubjs.join(', ') || '<span class="text-slate-300 italic">없음</span>'}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Dedicated Work Memo & Notes for this Saved Plan -->
          <div class="mt-2.5 pt-2.5 border-t ${isConfirmed ? 'border-amber-200' : 'border-slate-100'} space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold ${isConfirmed ? 'text-amber-950' : 'text-slate-700'} flex items-center gap-1.5">
                <span>📝 시간표 작업 메모 및 특이사항:</span>
              </label>
              <span class="text-[11px] ${isConfirmed ? 'text-amber-700' : 'text-slate-400'} font-normal">입력 시 자동 저장되며 엑셀 다운로드에 포함됩니다</span>
            </div>
            <textarea 
              rows="2" 
              class="w-full text-xs p-2.5 border ${isConfirmed ? 'border-amber-300 bg-white/95 focus:border-amber-500' : 'border-slate-300 bg-slate-50/60 focus:ring-blue-500'} hover:border-slate-400 rounded-lg focus:ring-2 outline-none placeholder-slate-400 hover:bg-white focus:bg-white transition leading-relaxed resize-y font-sans" 
              placeholder="이 안에 대한 검토 의견, 교사 배정 메모, 학생 특이사항 등을 자유롭게 기록하세요..."
              data-plan-id="${plan.id}"
              oninput="window.handleSavedPlanMemoChange('${plan.id}', this.value)"
            >${escapeHtml(plan.memo || '')}</textarea>
          </div>

          <!-- Action Toolbar -->
          <div class="flex flex-wrap items-center justify-between pt-2 border-t ${isConfirmed ? 'border-amber-200' : 'border-slate-100'} gap-2">
            <div class="flex items-center space-x-2">
              <button class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-1" onclick="loadSavedPlan('${plan.id}')">
                <span>👁️ 학생별 배정 시간표 보기 & 적용</span>
              </button>
              <button class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-1" onclick="exportSinglePlanExcel('${plan.id}')">
                <span>📥 이 안 엑셀 다운로드 (.xlsx)</span>
              </button>
            </div>
            <button class="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 hover:bg-rose-50 rounded transition-colors" title="후보안 삭제" onclick="deleteSavedPlan('${plan.id}')">
              삭제
            </button>
          </div>
        </div>
        `;
      }).join('');
    }

    window.loadSavedPlan = function(planId) {
      const plan = AppState.savedPlans.find(p => p.id === planId || String(p.id) === String(planId));
      if (!plan) {
        alert('선택한 저장안을 찾을 수 없습니다.');
        return;
      }

      AppState.currentSemester = plan.semester;
      savedPlansActiveTab = plan.semester;
      isConflictTableExpanded = false;
      AppState.currentPlan = {
        id: plan.id,
        name: plan.name,
        semester: plan.semester,
        groups: JSON.parse(JSON.stringify(plan.groups)),
        conflictCount: plan.conflictCount,
        conflicts: JSON.parse(JSON.stringify(plan.conflicts)),
        customAssignments: JSON.parse(JSON.stringify(plan.customAssignments || {})),
        memo: plan.memo || '',
        timestamp: plan.timestamp
      };
      if (!AppState.currentPlans) AppState.currentPlans = { 1: null, 2: null };
      AppState.currentPlans[plan.semester] = AppState.currentPlan;

      // Restore toggles UI without re-running optimization
      updateStep2SemesterTabs(plan.semester);

      if (plan.togetherConfig) {
        AppState.togetherPairs[plan.semester] = JSON.parse(JSON.stringify(plan.togetherConfig));
      }
      if (plan.separateConfig) {
        AppState.separatePairs[plan.semester] = JSON.parse(JSON.stringify(plan.separateConfig));
      }
      if (plan.studentRecommendations) {
        AppState.currentPlan.studentRecommendations = JSON.parse(JSON.stringify(plan.studentRecommendations));
      } else {
        AppState.currentPlan.studentRecommendations = {};
      }
      if (plan.lockedConfig) {
        if (!AppState.lockedGroups) AppState.lockedGroups = { 1: {}, 2: {} };
        AppState.lockedGroups[plan.semester] = JSON.parse(JSON.stringify(plan.lockedConfig));
      }

      initStep2Controls();
      renderStep2Results();
      renderYearGradeNav();

      const memoTextarea = document.getElementById('planWorkMemo');
      if (memoTextarea) {
        memoTextarea.value = plan.memo || '';
      }

      // Smooth scroll so that '수강 충돌 발생 학생 수' card is at the top of view
      const scrollToConflictCard = () => {
        const conflictTarget = document.getElementById('conflictMetricCard') || document.getElementById('statConflictCount');
        if (conflictTarget) {
          const headerOffset = 110; // Sticky topbar & nav offset
          const elementPosition = conflictTarget.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });
        }
      };

      scrollToConflictCard();
      alert(`📂 [${plan.name}]의 학생별 이동수업 시간표 및 그룹 배치가 화면에 적용되었습니다.`);
      setTimeout(scrollToConflictCard, 50);
    };

    window.deleteSavedPlan = function(planId) {
      if (confirm('이 저장안을 삭제하시겠습니까?')) {
        AppState.savedPlans = AppState.savedPlans.filter(p => p.id !== planId && String(p.id) !== String(planId));
        renderSavedPlansList();
        saveAllState();
      }
    };

    // Helper to build fully styled Timetable and Placement sheets
    // Helper to build Timetable sheet
    function buildTimetableSheet(wb, plan, customSheetName) {
      const { groupCounts: expGroupCounts, studentGroupOverlaps: expOverlaps } = analyzeGroupConflicts(plan);
      const sem = plan.semester || AppState.currentSemester || 1;
      const acadYearStr = MultiState?.activeAcademicYear || '2027학년도';
      const gradeStr = AppState.detectedGrade || MultiState?.activeGrade || '3학년';

      const pastelGroupThemes = [
        { headerBg: 'DBEAFE', headerText: '1E40AF', subBg: 'EFF6FF', subText: '1E40AF', border: '93C5FD' }, // 파스텔 소프트 블루
        { headerBg: 'CCFBF1', headerText: '0F766E', subBg: 'F0FDFA', subText: '0F766E', border: '5EEAD4' }, // 파스텔 소프트 민트
        { headerBg: 'EDE9FE', headerText: '5B21B6', subBg: 'F5F3FF', subText: '5B21B6', border: 'C4B5FD' }, // 파스텔 소프트 라벤더
        { headerBg: 'FFEDD5', headerText: '9A3412', subBg: 'FFF7ED', subText: '9A3412', border: 'FDBA74' }, // 파스텔 소프트 피치
        { headerBg: 'FEF3C7', headerText: '92400E', subBg: 'FFFBEB', subText: '92400E', border: 'FCD34D' }, // 파스텔 소프트 앰버
        { headerBg: 'FFE4E6', headerText: '9F1239', subBg: 'FFF1F2', subText: '9F1239', border: 'FDA4AF' }, // 파스텔 소프트 로즈
        { headerBg: 'E0E7FF', headerText: '3730A3', subBg: 'EEF2FF', subText: '3730A3', border: 'A5B4FC' }, // 파스텔 소프트 인디고
        { headerBg: 'D1FAE5', headerText: '065F46', subBg: 'ECFDF5', subText: '065F46', border: '6EE7B7' }  // 파스텔 소프트 에메랄드
      ];

      const softBorder = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      const ttSheetName = (customSheetName || `${sem}학기_${plan.name || '배치안'}_학생시간표`).substring(0, 31);
      const ttRows = [
        [`${acadYearStr} ${gradeStr} ${sem}학기 학생별 그룹 시간표`],
        [`대상 학년: ${gradeStr} | 총 학생 수: ${AppState.students.length}명 | 수강 충돌 인원: ${plan.conflictCount}명 | 출력일시: ${new Date().toLocaleString()}`],
        []
      ];

      const h1 = ['반', '번호', '이름', '진로/관심학과'];
      const h2 = ['', '', '', ''];
      const merges = [
        { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // 반
        { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // 번호
        { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, // 이름
        { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } }  // 진로
      ];

      let colIdx = 4;
      const colWidths = [
        { wch: 6 },
        { wch: 6 },
        { wch: 11 },
        { wch: 18 }
      ];

      const groupColSpans = [];

      plan.groups.forEach((groupSubjs, gIdx) => {
        const startCol = colIdx;
        const span = Math.max(groupSubjs.length, 1);
        groupColSpans.push({ startCol, span, gIdx });

        h1.push(`${gIdx + 1}그룹 (중복 ${expGroupCounts[gIdx] || 0}명)`);
        for (let k = 1; k < span; k++) h1.push('');

        if (span > 1) {
          merges.push({ s: { r: 3, c: startCol }, e: { r: 3, c: startCol + span - 1 } });
        }

        if (groupSubjs.length === 0) {
          h2.push('(과목 없음)');
          colWidths.push({ wch: 12 });
        } else {
          groupSubjs.forEach(sName => {
            h2.push(sName);
            colWidths.push({ wch: Math.max(12, Math.min(22, sName.length * 2.2 + 4)) });
          });
        }
        colIdx += span;
      });

      h1.push('배정 상태');
      h2.push('');
      merges.push({ s: { r: 3, c: colIdx }, e: { r: 4, c: colIdx } });
      colWidths.push({ wch: 14 });
      colIdx++;

      h1.push('추천/상담 메모');
      h2.push('');
      merges.push({ s: { r: 3, c: colIdx }, e: { r: 4, c: colIdx } });
      colWidths.push({ wch: 25 });
      colIdx++;

      const totalCols = colIdx;
      ttRows.push(h1);
      ttRows.push(h2);

      AppState.students.forEach(st => {
        const row = [st.classNum, st.studentNum, st.name, st.career];
        const overlaps = expOverlaps[st.id] || {};
        let hasConflict = false;
        const confList = [];

        plan.groups.forEach((groupSubjs, gIdx) => {
          const inGrp = overlaps[gIdx] || [];
          if (inGrp.length > 1) {
            hasConflict = true;
            confList.push(`${gIdx + 1}그룹`);
          }

          if (groupSubjs.length === 0) {
            row.push('-');
          } else {
            groupSubjs.forEach(sName => {
              if (inGrp.includes(sName)) {
                row.push('선택');
              } else {
                row.push('');
              }
            });
          }
        });

        row.push(hasConflict ? `중복 (${confList.join(', ')})` : '정상 배정');
        row.push((plan.studentRecommendations && plan.studentRecommendations[st.id]) || '');
        ttRows.push(row);
      });

      // Compute subject counts in this plan
      const subjCounts = {};
      plan.groups.forEach(groupSubjs => {
        groupSubjs.forEach(sName => {
          subjCounts[sName] = 0;
        });
      });

      AppState.students.forEach(st => {
        const overlaps = expOverlaps[st.id] || {};
        plan.groups.forEach((groupSubjs, gIdx) => {
          const inGrp = overlaps[gIdx] || [];
          inGrp.forEach(sName => {
            if (subjCounts[sName] !== undefined) {
              subjCounts[sName]++;
            }
          });
        });
      });

      // 1. Spacer Row
      ttRows.push([]);

      // 2. Subject Totals Row
      const firstStudentRowExcel = 6;
      const lastStudentRowExcel = 5 + AppState.students.length;

      const subjSumRow = ['과목 수강 총 인원', '', '', ''];
      plan.groups.forEach(groupSubjs => {
        if (groupSubjs.length === 0) {
          subjSumRow.push('');
        } else {
          groupSubjs.forEach(sName => {
            subjSumRow.push(`${subjCounts[sName] || 0}명`);
          });
        }
      });
      subjSumRow.push(''); // for status col
      subjSumRow.push(''); // for memo col
      const subjSumR = ttRows.length;
      ttRows.push(subjSumRow);
      merges.push({ s: { r: subjSumR, c: 0 }, e: { r: subjSumR, c: 3 } });

      // 3. Group Totals Row
      const grpSumRow = ['그룹별 총 인원', '', '', ''];
      plan.groups.forEach(groupSubjs => {
        const groupTotal = groupSubjs.reduce((acc, sName) => acc + (subjCounts[sName] || 0), 0);
        if (groupSubjs.length === 0) {
          grpSumRow.push(`${groupTotal}명`);
        } else {
          groupSubjs.forEach((sName, sIdx) => {
            if (sIdx === 0) {
              grpSumRow.push(`${groupTotal}명`);
            } else {
              grpSumRow.push('');
            }
          });
        }
      });
      grpSumRow.push(''); // for status col
      grpSumRow.push(''); // for memo col
      const grpSumR = ttRows.length;
      ttRows.push(grpSumRow);
      merges.push({ s: { r: grpSumR, c: 0 }, e: { r: grpSumR, c: 3 } });

      let memoHRIdx = -1;
      let memoCRIdx = -1;
      if (plan.memo && plan.memo.trim()) {
        ttRows.push([]);

        const memoHRow = ['📝 [시간표 작업 메모 및 특이사항]'];
        for (let c = 1; c < totalCols; c++) memoHRow.push('');
        memoHRIdx = ttRows.length;
        ttRows.push(memoHRow);
        merges.push({ s: { r: memoHRIdx, c: 0 }, e: { r: memoHRIdx, c: totalCols - 1 } });

        const memoCRow = [plan.memo.trim()];
        for (let c = 1; c < totalCols; c++) memoCRow.push('');
        memoCRIdx = ttRows.length;
        ttRows.push(memoCRow);
        merges.push({ s: { r: memoCRIdx, c: 0 }, e: { r: memoCRIdx, c: totalCols - 1 } });
      }

      const wsTT = XLSX.utils.aoa_to_sheet(ttRows);
      merges.unshift(
        { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }
      );
      wsTT['!merges'] = merges;
      wsTT['!cols'] = colWidths;

      const rowHeights = [
        { hpt: 32 },
        { hpt: 20 },
        { hpt: 10 },
        { hpt: 26 },
        { hpt: 24 }
      ];

      // Style TT Sheet Title & Subtitle
      ExcelStyler.setRange(wsTT, 0, 0, 0, totalCols - 1, {
        font: { name: ExcelStyler.fontFamily, sz: 14, bold: true, color: { rgb: '1E3A8A' } },
        fill: { fgColor: { rgb: 'EEF2FF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '93C5FD' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      });
      ExcelStyler.setRange(wsTT, 1, 0, 1, totalCols - 1, {
        font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: '64748B' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'medium', color: { rgb: '93C5FD' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      });

      // Header Row 3 & 4
      for (let c = 0; c < 4; c++) {
        const isRight = (c === 3);
        const infoBorder = ExcelStyler.getBorder(isRight, c === 0, 'medium', 'medium');
        ExcelStyler.setCell(wsTT, 3, c, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '1E3A8A' } },
          fill: { fgColor: { rgb: 'E0E7FF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: infoBorder
        });
        ExcelStyler.setCell(wsTT, 4, c, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '1E3A8A' } },
          fill: { fgColor: { rgb: 'E0E7FF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: infoBorder
        });
      }

      // Group Headers
      groupColSpans.forEach(item => {
        const gTheme = pastelGroupThemes[item.gIdx % pastelGroupThemes.length];
        for (let c = item.startCol; c < item.startCol + item.span; c++) {
          const isGroupRight = (c === item.startCol + item.span - 1);
          const isGroupLeft = (c === item.startCol);

          ExcelStyler.setCell(wsTT, 3, c, {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: gTheme.headerText } },
            fill: { fgColor: { rgb: gTheme.headerBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: ExcelStyler.getBorder(isGroupRight, isGroupLeft, 'medium', 'thin')
          });

          ExcelStyler.setCell(wsTT, 4, c, {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: gTheme.subText } },
            fill: { fgColor: { rgb: gTheme.subBg } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: ExcelStyler.getBorder(isGroupRight, isGroupLeft, 'thin', 'medium')
          });
        }
      });

      // Status & Memo Header
      for (let c = colIdx - 2; c < colIdx; c++) {
        ExcelStyler.setCell(wsTT, 3, c, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '1E293B' } },
          fill: { fgColor: { rgb: 'E2E8F0' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: ExcelStyler.getBorder(c === colIdx - 1, c === colIdx - 2, 'medium', 'medium')
        });
        ExcelStyler.setCell(wsTT, 4, c, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '1E293B' } },
          fill: { fgColor: { rgb: 'E2E8F0' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: ExcelStyler.getBorder(c === colIdx - 1, c === colIdx - 2, 'medium', 'medium')
        });
      }

      // Student rows styling
      AppState.students.forEach((st, sIdx) => {
        const r = 5 + sIdx;
        const isEven = sIdx % 2 === 1;
        rowHeights.push({ hpt: 22 });
        const overlaps = expOverlaps[st.id] || {};

        ExcelStyler.setCell(wsTT, r, 0, ExcelStyler.dataCenter(isEven, false, true));
        ExcelStyler.setCell(wsTT, r, 1, ExcelStyler.dataCenter(isEven, false, false));
        ExcelStyler.setCell(wsTT, r, 2, ExcelStyler.dataBold(isEven, false, false));
        ExcelStyler.setCell(wsTT, r, 3, ExcelStyler.dataLeft(isEven, true, false));

        let curC = 4;
        let hasConflict = false;
        plan.groups.forEach((groupSubjs, gIdx) => {
          const inGrp = overlaps[gIdx] || [];
          const isGrpConf = inGrp.length > 1;

          if (groupSubjs.length === 0) {
            ExcelStyler.setCell(wsTT, r, curC, ExcelStyler.dataCenter(isEven, true, true));
            curC++;
          } else {
            groupSubjs.forEach((sName, sIdx) => {
              const isGroupRight = (sIdx === groupSubjs.length - 1);
              const isGroupLeft = (sIdx === 0);

              if (inGrp.includes(sName)) {
                if (isGrpConf) {
                  hasConflict = true;
                  ExcelStyler.setCell(wsTT, r, curC, {
                    font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: 'DC2626' } },
                    fill: { fgColor: { rgb: 'FEE2E2' } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: ExcelStyler.getBorder(isGroupRight, isGroupLeft)
                  });
                } else {
                  ExcelStyler.setCell(wsTT, r, curC, {
                    font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '1D4ED8' } },
                    fill: { fgColor: { rgb: 'EFF6FF' } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: ExcelStyler.getBorder(isGroupRight, isGroupLeft)
                  });
                }
              } else {
                ExcelStyler.setCell(wsTT, r, curC, ExcelStyler.dataCenter(isEven, isGroupRight, isGroupLeft));
              }
              curC++;
            });
          }
        });

        // 상태
        ExcelStyler.setCell(wsTT, r, curC, {
          font: { name: ExcelStyler.fontFamily, sz: 9.5, bold: hasConflict, color: { rgb: hasConflict ? 'DC2626' : '15803D' } },
          fill: { fgColor: { rgb: hasConflict ? 'FEE2E2' : (isEven ? 'F8FAFC' : 'FFFFFF') } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: ExcelStyler.getBorder(true, true)
        });
        curC++;

        // 추천/상담 메모
        ExcelStyler.setCell(wsTT, r, curC, {
          font: { name: ExcelStyler.fontFamily, sz: 9, color: { rgb: '475569' } },
          fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: ExcelStyler.getBorder(true, false)
        });
      });

      // Bottom Summary Rows Styling
      rowHeights.push({ hpt: 12 });
      rowHeights.push({ hpt: 24 });
      rowHeights.push({ hpt: 26 });

      // 1. Style Subject Sum Row
      ExcelStyler.setRange(wsTT, subjSumR, 0, subjSumR, 3, {
        font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: '1E3A8A' } },
        fill: { fgColor: { rgb: 'EEF2FF' } },
        alignment: { vertical: 'center', horizontal: 'center' },
        border: softBorder
      });

      let sumColIdx = 4;
      plan.groups.forEach((groupSubjs, gIdx) => {
        const gTheme = pastelGroupThemes[gIdx % pastelGroupThemes.length];
        if (groupSubjs.length === 0) {
          const sumCellRef = XLSX.utils.encode_cell({ r: subjSumR, c: sumColIdx });
          wsTT[sumCellRef] = {
            t: 's',
            v: '-',
            s: {
              font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: '64748B' } },
              fill: { fgColor: { rgb: gTheme.subBg } },
              alignment: { vertical: 'center', horizontal: 'center' },
              border: softBorder
            }
          };
          sumColIdx++;
        } else {
          groupSubjs.forEach((sName, sIdx) => {
            const isGroupRight = (sIdx === groupSubjs.length - 1);
            const isGroupLeft = (sIdx === 0);
            const colLetter = XLSX.utils.encode_col(sumColIdx);
            const sumCellRef = XLSX.utils.encode_cell({ r: subjSumR, c: sumColIdx });

            // COUNTIF 함수 사용 (선택 표기 인원 동적 집계 및 빈 셀 테두리 완벽 유지)
            const countFormula = `COUNTIF(${colLetter}${firstStudentRowExcel}:${colLetter}${lastStudentRowExcel},"선택")`;

            wsTT[sumCellRef] = {
              t: 'n',
              f: countFormula,
              v: subjCounts[sName] || 0,
              z: '#,##0"명"',
              s: {
                font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: gTheme.headerText } },
                fill: { fgColor: { rgb: gTheme.subBg } },
                alignment: { vertical: 'center', horizontal: 'center' },
                border: ExcelStyler.getBorder(isGroupRight, isGroupLeft, 'thin', 'thin')
              }
            };
            sumColIdx++;
          });
        }
      });
      ExcelStyler.setCell(wsTT, subjSumR, sumColIdx, ExcelStyler.dataCenter(false, true, true));
      ExcelStyler.setCell(wsTT, subjSumR, sumColIdx + 1, ExcelStyler.dataCenter(false, true, false));

      // 2. Style Group Sum Row with SUM function
      ExcelStyler.setRange(wsTT, grpSumR, 0, grpSumR, 3, {
        font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { vertical: 'center', horizontal: 'center' },
        border: softBorder
      });

      let grpColIdx = 4;
      plan.groups.forEach((groupSubjs, gIdx) => {
        const gTheme = pastelGroupThemes[gIdx % pastelGroupThemes.length];
        const groupTotal = groupSubjs.reduce((acc, sName) => acc + (subjCounts[sName] || 0), 0);

        if (groupSubjs.length === 0) {
          const grpCellRef = XLSX.utils.encode_cell({ r: grpSumR, c: grpColIdx });
          wsTT[grpCellRef] = {
            t: 's',
            v: '-',
            s: {
              font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: '64748B' } },
              fill: { fgColor: { rgb: gTheme.headerBg } },
              alignment: { vertical: 'center', horizontal: 'center' },
              border: softBorder
            }
          };
          grpColIdx++;
        } else {
          const startColLetter = XLSX.utils.encode_col(grpColIdx);
          const endColLetter = XLSX.utils.encode_col(grpColIdx + groupSubjs.length - 1);
          const subjSumRowExcel = subjSumR + 1;
          const sumFormula = (groupSubjs.length === 1)
            ? `${startColLetter}${subjSumRowExcel}`
            : `SUM(${startColLetter}${subjSumRowExcel}:${endColLetter}${subjSumRowExcel})`;

          groupSubjs.forEach((sName, sIdx) => {
            const isGroupRight = (sIdx === groupSubjs.length - 1);
            const isGroupLeft = (sIdx === 0);
            const grpCellRef = XLSX.utils.encode_cell({ r: grpSumR, c: grpColIdx });

            if (sIdx === 0) {
              wsTT[grpCellRef] = {
                t: 'n',
                f: sumFormula,
                v: groupTotal,
                z: '#,##0"명"',
                s: {
                  font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: gTheme.headerText } },
                  fill: { fgColor: { rgb: gTheme.headerBg } },
                  alignment: { vertical: 'center', horizontal: 'center' },
                  border: ExcelStyler.getBorder(isGroupRight, isGroupLeft, 'thin', 'double')
                }
              };
            } else {
              wsTT[grpCellRef] = {
                t: 's',
                v: '',
                s: {
                  fill: { fgColor: { rgb: gTheme.headerBg } },
                  border: ExcelStyler.getBorder(isGroupRight, isGroupLeft, 'thin', 'double')
                }
              };
            }
            grpColIdx++;
          });
        }
      });
      ExcelStyler.setCell(wsTT, grpSumR, grpColIdx, ExcelStyler.dataCenter(false, true, true));
      ExcelStyler.setCell(wsTT, grpSumR, grpColIdx + 1, ExcelStyler.dataCenter(false, true, false));

      if (memoHRIdx !== -1 && memoCRIdx !== -1) {
        const memoLines = (plan.memo || '').trim().split('\n');
        rowHeights.push({ hpt: 10 });
        rowHeights.push({ hpt: 24 });
        rowHeights.push({ hpt: Math.min(160, Math.max(40, memoLines.length * 18)) });

        ExcelStyler.setRange(wsTT, memoHRIdx, 0, memoHRIdx, totalCols - 1, {
          font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: '1E3A8A' } },
          fill: { fgColor: { rgb: 'EEF2FF' } },
          alignment: { vertical: 'center', horizontal: 'left' },
          border: softBorder
        });
        ExcelStyler.setRange(wsTT, memoCRIdx, 0, memoCRIdx, totalCols - 1, {
          font: { name: '맑은 고딕', sz: 10, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: 'F8FAFC' } },
          alignment: { vertical: 'top', horizontal: 'left', wrapText: true },
          border: softBorder
        });
      }

      wsTT['!rows'] = rowHeights;
      XLSX.utils.book_append_sheet(wb, wsTT, ttSheetName);
    }

    // Helper to build Single Plan Placement Sheet
        // 대한민국 2015/2022 개정 교육과정 표준 교과군 자동 분류 사전 (3단계 미설정 시에도 100% 보장)
    function inferStandardSubjectCategory(subj) {
      if (!subj) return '선택';
      const s = String(subj).trim();
      const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(s) : s.replace(/\s+/g, '');

      // 1. 국어과
      if (/국어|화법|독서|작문|문학|언어와매체|고전읽기|심화국어|매체의사소통/.test(norm)) return '국어';
      // 2. 수학과
      if (/수학|미적분|확률과통계|확률|통계|기하|경제수학|인공지능수학|수학과제/.test(norm)) return '수학';
      // 3. 영어과
      if (/영어|영미|영어회화|영어독해|실용영어|진로영어/.test(norm)) return '영어';
      // 4. 한국사
      if (/한국사/.test(norm)) return '한국사';
      // 5. 사회과 (역사/도덕/지리/일반사회)
      if (/한국지리|세계지리|지리|세계사|동아시아사|역사|경제|정치와법|정치|사회문화|생활과윤리|윤리와사상|윤리|사회문제|고전과윤리|통합사회|여행지리|현대사회/.test(norm)) return '사회';
      // 6. 과학과
      if (/물리학|물리|화학|생명과학|지구과학|과학탐구|융합과학|과학사|생활과과학|통합과학|생물/.test(norm)) return '과학';
      // 7. 체육과
      if (/체육|운동과건강|스포츠|체육탐구/.test(norm)) return '체육';
      // 8. 예술과
      if (/음악|미술|연극|창작|감상과비평|음악연주|미술창작/.test(norm)) return '예술';
      // 9. 기술·가정 / 정보
      if (/기술가정|가정과학|공학|농업|해양|지식재산/.test(norm)) return '기술·가정';
      if (/정보|프로그래밍|컴퓨터|코딩|소프트웨어|인공지능기초/.test(norm)) return '정보';
      // 10. 제2외국어
      if (/일본어|중국어|독일어|프랑스어|스페인어|러시아어|아랍어|베트남어/.test(norm)) return '제2외국어';
      // 11. 한문
      if (/한문|한자/.test(norm)) return '한문';
      // 12. 교양
      if (/철학|논리학|심리학|교육학|종교학|진로와직업|진로|보건|환경|실용경제|생애설계/.test(norm)) return '교양';

      return '선택';
    }

    // 배치표 엑셀 출력 시 과목명을 '[교과군] 과목명' 형식으로 변환하는 헬퍼
    function formatSubjectWithCategory(subj, grade) {
      if (!subj || typeof subj !== 'string') return '';
      const rawSubj = subj.trim();
      if (!rawSubj || rawSubj.startsWith('(')) return rawSubj;
      if (/^\[.+?\]\s*/.test(rawSubj)) return rawSubj; // 이미 [교과군]이 붙은 경우 중복 방지

      const sData = (typeof getStep3Data === 'function') ? getStep3Data() : { categories: [], mappings: {} };
      const allCategories = Array.isArray(sData.categories) ? sData.categories : [];
      const cleanSubj = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(rawSubj) : rawSubj.replace(/[\(\[].*?[\)\]]/g, '').trim();

      let catName = '';

      // 1순위: 3단계 직접 매핑 조회 (학년 우선, 학년 무관)
      let catId = (typeof getSubjectCategory === 'function') ? getSubjectCategory(cleanSubj, grade) : null;
      if (!catId && typeof getSubjectCategory === 'function') {
        catId = getSubjectCategory(rawSubj, grade) || getSubjectCategory(cleanSubj, null) || getSubjectCategory(rawSubj, null);
      }

      if (catId) {
        const found = allCategories.find(c => c.id === catId);
        if (found && found.name) {
          catName = found.name.trim();
        }
      }

      // 2순위: 편제표(getAllGradesCurriculum)에서 보충 탐색
      if (!catName) {
        const curriculum = (typeof getAllGradesCurriculum === 'function') ? getAllGradesCurriculum() : [];
        const normClean = (typeof normalizeSubject === 'function') ? normalizeSubject(cleanSubj) : cleanSubj.toLowerCase();
        const currItem = curriculum.find(c => {
          const cNorm = (typeof normalizeSubject === 'function') ? normalizeSubject(c.subject) : (c.subject || '').toLowerCase();
          return cNorm === normClean || c.subject === cleanSubj || c.subject === rawSubj;
        });
        if (currItem && currItem.category && !currItem.category.includes('선택') && !currItem.category.includes('지정')) {
          catName = currItem.category.trim();
        }
      }

      // 3순위: 대한민국 고등학교 표준 교육과정 교과군 자동 추론 (100% 매칭 보장!)
      if (!catName) {
        const stdCat = inferStandardSubjectCategory(cleanSubj || rawSubj);
        if (stdCat && stdCat !== '선택') {
          // 3단계 categories 목록에 유사한 카테고리가 있다면 매핑
          const matched3rdCat = allCategories.find(c => {
            const cName = (c.name || '').replace(/\s+/g, '');
            if (cName.includes(stdCat)) return true;
            if (['제2외국어', '한문', '교양', '정보', '기술·가정'].includes(stdCat) && cName.includes('생활')) return true;
            if (stdCat === '과학' && cName.includes('과학')) return true;
            if (stdCat === '사회' && cName.includes('사회')) return true;
            return false;
          });

          if (matched3rdCat && matched3rdCat.name) {
            catName = matched3rdCat.name.trim();
          } else {
            // 표준 카테고리명 직접 부여
            if (['제2외국어', '한문', '교양'].includes(stdCat)) {
              catName = '생활·교양';
            } else {
              catName = stdCat;
            }
          }
        }
      }

      // 너무 긴 시스템 기본 카테고리명 깔끔하게 축약 (예: '생활·교양·기술·가정·정보·제2외국어' -> '생활·교양')
      if (catName.includes('생활·교양')) {
        catName = '생활·교양';
      }

      if (catName) {
        return `[${catName}] ${rawSubj}`;
      }
      return `[선택] ${rawSubj}`;
    }
    window.formatSubjectWithCategory = formatSubjectWithCategory;

    function buildPlacementSheet(wb, plan, customSheetName) {
      const { groupCounts: expGroupCounts } = analyzeGroupConflicts(plan);
      const sem = plan.semester || AppState.currentSemester || 1;
      const acadYearStr = MultiState?.activeAcademicYear || '2027학년도';
      const gradeStr = AppState.detectedGrade || MultiState?.activeGrade || '3학년';

      const pastelGroupThemes = [
        { headerBg: 'DBEAFE', headerText: '1E40AF', subBg: 'EFF6FF', subText: '1E40AF', border: '93C5FD' },
        { headerBg: 'CCFBF1', headerText: '0F766E', subBg: 'F0FDFA', subText: '0F766E', border: '5EEAD4' },
        { headerBg: 'EDE9FE', headerText: '5B21B6', subBg: 'F5F3FF', subText: '5B21B6', border: 'C4B5FD' },
        { headerBg: 'FFEDD5', headerText: '9A3412', subBg: 'FFF7ED', subText: '9A3412', border: 'FDBA74' },
        { headerBg: 'FEF3C7', headerText: '92400E', subBg: 'FFFBEB', subText: '92400E', border: 'FCD34D' },
        { headerBg: 'FFE4E6', headerText: '9F1239', subBg: 'FFF1F2', subText: '9F1239', border: 'FDA4AF' },
        { headerBg: 'E0E7FF', headerText: '3730A3', subBg: 'EEF2FF', subText: '3730A3', border: 'A5B4FC' },
        { headerBg: 'D1FAE5', headerText: '065F46', subBg: 'ECFDF5', subText: '065F46', border: '6EE7B7' }
      ];

      const softBorder = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      const placementSheetName = (customSheetName || `${sem}학기_${plan.name || '배치안'}_배치표`).substring(0, 31);
      const planRows = [
        [`${acadYearStr} ${gradeStr} ${sem}학기 과목 그룹핑 배치표`],
        [`총 충돌 인원: ${plan.conflictCount}명 | 편성 그룹: ${plan.groups.length}개 | 출력일시: ${new Date().toLocaleString()}`],
        []
      ];

      const grpHeader = [];
      const placeCols = [];
      plan.groups.forEach((_, gIdx) => {
        grpHeader.push(`${gIdx + 1}그룹`);
        placeCols.push({ wch: 22 });
      });
      planRows.push(grpHeader);

      const maxLen = Math.max(...plan.groups.map(g => g.length), 0);
      for (let r = 0; r < maxLen; r++) {
        const row = [];
        plan.groups.forEach(g => {
          row.push(g[r] || '');
        });
        planRows.push(row);
      }

      const wsPlan = XLSX.utils.aoa_to_sheet(planRows);
      wsPlan['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: plan.groups.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: plan.groups.length - 1 } }
      ];
      wsPlan['!cols'] = placeCols;

      const placeHeights = [
        { hpt: 32 },
        { hpt: 20 },
        { hpt: 10 },
        { hpt: 28 }
      ];

      ExcelStyler.setRange(wsPlan, 0, 0, 0, plan.groups.length - 1, {
        font: { name: ExcelStyler.fontFamily, sz: 13, bold: true, color: { rgb: '1E3A8A' } },
        fill: { fgColor: { rgb: 'EEF2FF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: softBorder
      });
      ExcelStyler.setRange(wsPlan, 1, 0, 1, plan.groups.length - 1, {
        font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: '64748B' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: softBorder
      });

      plan.groups.forEach((_, gIdx) => {
        const gTheme = pastelGroupThemes[gIdx % pastelGroupThemes.length];
        ExcelStyler.setCell(wsPlan, 3, gIdx, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: gTheme.headerText } },
          fill: { fgColor: { rgb: gTheme.headerBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: gTheme.border } },
            bottom: { style: 'medium', color: { rgb: gTheme.border } },
            left: { style: 'thin', color: { rgb: 'CBD5E1' } },
            right: { style: 'thin', color: { rgb: 'CBD5E1' } }
          }
        });
      });

      for (let r = 0; r < maxLen; r++) {
        placeHeights.push({ hpt: 24 });
        const isEven = r % 2 === 1;
        plan.groups.forEach((g, gIdx) => {
          const val = g[r];
          ExcelStyler.setCell(wsPlan, 4 + r, gIdx, {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: !!val, color: { rgb: val ? '0F172A' : '94A3B8' } },
            fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: softBorder
          });
        });
      }

      wsPlan['!rows'] = placeHeights;
      XLSX.utils.book_append_sheet(wb, wsPlan, placementSheetName);
    }

    // Helper to build 1·2학기 과목배치 및 수강 인원 안내 시트 (세로형 Side-by-Side: 좌측 1학기, 우측 2학기)
    function buildSummaryTimetableSheet(wb, plan1, plan2, customSheetName = '1·2학기_과목배치_및_인원안내') {
      const acadYearStr = MultiState?.activeAcademicYear || '2027학년도';
      const gradeStr = AppState.detectedGrade || MultiState?.activeGrade || '3학년';

      const pastelGroupThemes = [
        { headerBg: 'DBEAFE', headerText: '1E40AF', subBg: 'EFF6FF', subText: '1E40AF', border: '93C5FD' }, // 파스텔 블루
        { headerBg: 'CCFBF1', headerText: '0F766E', subBg: 'F0FDFA', subText: '0F766E', border: '5EEAD4' }, // 파스텔 민트
        { headerBg: 'EDE9FE', headerText: '5B21B6', subBg: 'F5F3FF', subText: '5B21B6', border: 'C4B5FD' }, // 파스텔 라벤더
        { headerBg: 'FFEDD5', headerText: '9A3412', subBg: 'FFF7ED', subText: '9A3412', border: 'FDBA74' }, // 파스텔 피치
        { headerBg: 'FEF3C7', headerText: '92400E', subBg: 'FFFBEB', subText: '92400E', border: 'FCD34D' }, // 파스텔 앰버
        { headerBg: 'FFE4E6', headerText: '9F1239', subBg: 'FFF1F2', subText: '9F1239', border: 'FDA4AF' }, // 파스텔 로즈
        { headerBg: 'E0E7FF', headerText: '3730A3', subBg: 'EEF2FF', subText: '3730A3', border: 'A5B4FC' }, // 파스텔 인디고
        { headerBg: 'D1FAE5', headerText: '065F46', subBg: 'ECFDF5', subText: '065F46', border: '6EE7B7' }  // 파스텔 에메랄드
      ];

      const softBorder = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      const summaryBorder = {
        top: { style: 'medium', color: { rgb: '64748B' } },
        bottom: { style: 'double', color: { rgb: '0F172A' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      // 1. 각 학기별 데이터 집계 및 세로 행 목록 생성
      function prepareSemesterItems(plan, semNum) {
        if (!plan || !plan.groups || plan.groups.length === 0) {
          return { items: [], totalSubjects: 0, totalChoices: 0 };
        }
        const { studentGroupOverlaps } = analyzeGroupConflicts(plan);
        const subjCounts = {};
        plan.groups.forEach(gSubjs => {
          gSubjs.forEach(s => { subjCounts[s] = 0; });
        });

        if (AppState.students && Array.isArray(AppState.students)) {
          AppState.students.forEach(st => {
            const overlaps = studentGroupOverlaps[st.id] || {};
            plan.groups.forEach((gSubjs, gIdx) => {
              const inGrp = overlaps[gIdx] || [];
              inGrp.forEach(s => {
                if (subjCounts[s] !== undefined) subjCounts[s]++;
              });
            });
          });
        }

        const items = [];
        let totalSubjects = 0;
        let totalChoices = 0;

        plan.groups.forEach((gSubjs, gIdx) => {
          const gTot = gSubjs.reduce((acc, s) => acc + (subjCounts[s] || 0), 0);
          totalChoices += gTot;
          if (gSubjs.length === 0) {
            items.push({
              gIdx,
              gName: `${gIdx + 1}그룹`,
              gTot,
              isFirstInGroup: true,
              groupSpan: 1,
              sName: '(과목 없음)',
              count: 0
            });
          } else {
            totalSubjects += gSubjs.length;
            gSubjs.forEach((sName, sIdx) => {
              items.push({
                gIdx,
                gName: `${gIdx + 1}그룹`,
                gTot,
                isFirstInGroup: (sIdx === 0),
                groupSpan: gSubjs.length,
                sName,
                count: subjCounts[sName] || 0
              });
            });
          }
        });

        return { items, totalSubjects, totalChoices };
      }

      const sem1Data = prepareSemesterItems(plan1, 1);
      const sem2Data = prepareSemesterItems(plan2, 2);

      const maxDataRows = Math.max(sem1Data.items.length, sem2Data.items.length, 1);
      const totalColSpan = 7; // Col 0,1,2 (1학기) | Col 3 (구분) | Col 4,5,6 (2학기)

      const rows = [];
      const merges = [];
      const rowHeights = [];

      // Row 0: 메인 타이틀
      rows.push([`${acadYearStr} ${gradeStr} 선택과목 배치 및 수강 인원 안내`]);
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalColSpan - 1 } });
      rowHeights.push({ hpt: 32 });

      // Row 1: 서브 타이틀
      const totalStudentsCount = (AppState.students && AppState.students.length) || 0;
      rows.push([`대상: ${gradeStr} 전체 | 총 학생 수: ${totalStudentsCount}명 | 학생 배포 및 출력용 요약 시간표 | 출력일시: ${new Date().toLocaleDateString('ko-KR')}`]);
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalColSpan - 1 } });
      rowHeights.push({ hpt: 20 });

      // Row 2: 빈 여백 행
      rows.push([]);
      rowHeights.push({ hpt: 10 });

      // Row 3: '안내 사항' 타이틀 (빨간 글씨)
      rows.push(['안내 사항', '', '', '', '', '', '']);
      rowHeights.push({ hpt: 22 });

      // Row 4: 안내 사항 테이블 헤더 (학기 | 과목 | 내용 C~G열 병합)
      rows.push(['학기', '과목', '내용', '', '', '', '']);
      merges.push({ s: { r: 4, c: 2 }, e: { r: 4, c: 6 } });
      rowHeights.push({ hpt: 22 });

      // Row 5, 6: 안내 사항 2개 기본 입력 행 (테두리 및 C~G 병합 완료, 사용자가 엑셀에서 바로 입력 또는 행 추가 가능)
      const noticeRowsCount = 2;
      for (let nr = 0; nr < noticeRowsCount; nr++) {
        const curNoticeR = 5 + nr;
        rows.push(['', '', '', '', '', '', '']);
        merges.push({ s: { r: curNoticeR, c: 2 }, e: { r: curNoticeR, c: 6 } });
        rowHeights.push({ hpt: 24 });
      }

      // Row 7: 빈 여백 행
      rows.push([]);
      rowHeights.push({ hpt: 12 });

      // Row 8: 학기 대헤더 배너 (1학기 좌측 / 2학기 우측)
      const bannerR = rows.length; // 8
      const bannerRow = [
        '■ 1학기 선택과목 배치 및 수강 현황', '', '',
        '',
        '■ 2학기 선택과목 배치 및 수강 현황', '', ''
      ];
      rows.push(bannerRow);
      merges.push({ s: { r: bannerR, c: 0 }, e: { r: bannerR, c: 2 } });
      merges.push({ s: { r: bannerR, c: 4 }, e: { r: bannerR, c: 6 } });
      rowHeights.push({ hpt: 24 });

      // Row 9: 열 헤더 행
      const colHeaderR = rows.length; // 9
      const colHeaderRow = [
        '그룹 (총 인원)', '선택 과목명', '수강 인원',
        '',
        '그룹 (총 인원)', '선택 과목명', '수강 인원'
      ];
      rows.push(colHeaderRow);
      rowHeights.push({ hpt: 22 });

      // Row 10부터: 데이터 행들
      const dataStartR = rows.length; // 10
      for (let i = 0; i < maxDataRows; i++) {
        const rIdx = dataStartR + i;
        const row = ['', '', '', '', '', '', ''];

        // 1학기 (Col 0, 1, 2)
        if (i < sem1Data.items.length) {
          const item1 = sem1Data.items[i];
          if (item1.isFirstInGroup) {
            row[0] = `${item1.gName}\n(총 ${item1.gTot}명)`;
            if (item1.groupSpan > 1) {
              merges.push({ s: { r: rIdx, c: 0 }, e: { r: rIdx + item1.groupSpan - 1, c: 0 } });
            }
          }
          row[1] = item1.sName;
          row[2] = `${item1.count}명`;
        }

        // 구분 열 (Col 3)
        row[3] = '';

        // 2학기 (Col 4, 5, 6)
        if (i < sem2Data.items.length) {
          const item2 = sem2Data.items[i];
          if (item2.isFirstInGroup) {
            row[4] = `${item2.gName}\n(총 ${item2.gTot}명)`;
            if (item2.groupSpan > 1) {
              merges.push({ s: { r: rIdx, c: 4 }, e: { r: rIdx + item2.groupSpan - 1, c: 4 } });
            }
          }
          row[5] = item2.sName;
          row[6] = `${item2.count}명`;
        }

        rows.push(row);
        rowHeights.push({ hpt: 23 });
      }

      // 학기별 합계 행 (Total Summary Row: 수강 인원 총계 제외, 개설 과목 수만 표기)
      const summaryR = dataStartR + maxDataRows;
      const summaryRow = [
        '1학기 합계',
        `개설 ${sem1Data.totalSubjects}과목`,
        '',
        '',
        '2학기 합계',
        `개설 ${sem2Data.totalSubjects}과목`,
        ''
      ];
      rows.push(summaryRow);
      merges.push({ s: { r: summaryR, c: 1 }, e: { r: summaryR, c: 2 } });
      merges.push({ s: { r: summaryR, c: 5 }, e: { r: summaryR, c: 6 } });
      rowHeights.push({ hpt: 24 });

      // Sheet 생성
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!merges'] = merges;
      ws['!rows'] = rowHeights;

      // 열 너비 설정 (A4 가로 fit-to-page 최적화)
      ws['!cols'] = [
        { wch: 14 }, // Col 0: 1학기 그룹
        { wch: 20 }, // Col 1: 1학기 과목명
        { wch: 11 }, // Col 2: 1학기 인원
        { wch: 3 },  // Col 3: 중간 구분
        { wch: 14 }, // Col 4: 2학기 그룹
        { wch: 20 }, // Col 5: 2학기 과목명
        { wch: 11 }  // Col 6: 2학기 인원
      ];

      // A4 가로 인쇄 설정
      ws['!pageSetup'] = {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToWidth: 1,
        fitToHeight: 1,
        fitToPage: true
      };
      ws['!sheetPr'] = { pageSetUpPr: { fitToPage: true } };
      ws['!printOptions'] = {
        horizontalCentered: true,
        verticalCentered: false
      };
      ws['!margins'] = {
        left: 0.4,
        right: 0.4,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2
      };

      // 셀 스타일링 적용
      // Row 0: 메인 타이틀
      for (let c = 0; c < totalColSpan; c++) {
        const ref = XLSX.utils.encode_cell({ r: 0, c });
        if (!ws[ref]) ws[ref] = { v: '' };
        ExcelStyler.applyStyle(ws[ref], {
          font: { name: ExcelStyler.fontFamily, sz: 16, bold: true, color: { rgb: '1E293B' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        });
      }

      // Row 1: 서브 타이틀
      for (let c = 0; c < totalColSpan; c++) {
        const ref = XLSX.utils.encode_cell({ r: 1, c });
        if (!ws[ref]) ws[ref] = { v: '' };
        ExcelStyler.applyStyle(ws[ref], {
          font: { name: ExcelStyler.fontFamily, sz: 9, color: { rgb: '64748B' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        });
      }

      // Row 3: '안내 사항' 타이틀 (빨간 글씨, 굵게)
      const noticeTitleRef = XLSX.utils.encode_cell({ r: 3, c: 0 });
      if (!ws[noticeTitleRef]) ws[noticeTitleRef] = { v: '안내 사항' };
      ExcelStyler.applyStyle(ws[noticeTitleRef], {
        font: { name: ExcelStyler.fontFamily, sz: 11, bold: true, color: { rgb: 'DC2626' } },
        alignment: { horizontal: 'left', vertical: 'center' }
      });

      // Row 4: 안내 사항 테이블 헤더 (학기, 과목, 내용)
      const nh0 = XLSX.utils.encode_cell({ r: 4, c: 0 });
      if (!ws[nh0]) ws[nh0] = { v: '학기' };
      ExcelStyler.applyStyle(ws[nh0], {
        font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '334155' } },
        fill: { fgColor: { rgb: 'F1F5F9' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: softBorder
      });

      const nh1 = XLSX.utils.encode_cell({ r: 4, c: 1 });
      if (!ws[nh1]) ws[nh1] = { v: '과목' };
      ExcelStyler.applyStyle(ws[nh1], {
        font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '334155' } },
        fill: { fgColor: { rgb: 'F1F5F9' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: softBorder
      });

      for (let c = 2; c <= 6; c++) {
        const nhC = XLSX.utils.encode_cell({ r: 4, c });
        if (!ws[nhC]) ws[nhC] = { v: (c === 2 ? '내용' : '') };
        ExcelStyler.applyStyle(ws[nhC], {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });
      }

      // Row 5, 6: 안내 사항 2개 기본 입력 행
      for (let nr = 0; nr < noticeRowsCount; nr++) {
        const curR = 5 + nr;
        // 학기 (Col 0) - 가운데 정렬
        const nr0 = XLSX.utils.encode_cell({ r: curR, c: 0 });
        if (!ws[nr0]) ws[nr0] = { v: '' };
        ExcelStyler.applyStyle(ws[nr0], {
          font: { name: ExcelStyler.fontFamily, sz: 10, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });

        // 과목 (Col 1) - 왼쪽 정렬 + 들여쓰기 1
        const nr1 = XLSX.utils.encode_cell({ r: curR, c: 1 });
        if (!ws[nr1]) ws[nr1] = { v: '' };
        ExcelStyler.applyStyle(ws[nr1], {
          font: { name: ExcelStyler.fontFamily, sz: 10, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
          border: softBorder
        });

        // 내용 (Col 2~6) - 왼쪽 정렬 + 들여쓰기 1
        for (let c = 2; c <= 6; c++) {
          const nrC = XLSX.utils.encode_cell({ r: curR, c });
          if (!ws[nrC]) ws[nrC] = { v: '' };
          ExcelStyler.applyStyle(ws[nrC], {
            font: { name: ExcelStyler.fontFamily, sz: 10, color: { rgb: '0F172A' } },
            fill: { fgColor: { rgb: 'FFFFFF' } },
            alignment: { horizontal: 'left', vertical: 'center', indent: 1, wrapText: true },
            border: softBorder
          });
        }
      }

      // Row 8: 학기 배너 (bannerR)
      // 1학기 배너 (Col 0, 1, 2)
      for (let c = 0; c <= 2; c++) {
        const ref = XLSX.utils.encode_cell({ r: bannerR, c });
        if (!ws[ref]) ws[ref] = { v: '' };
        ExcelStyler.applyStyle(ws[ref], {
          font: { name: ExcelStyler.fontFamily, sz: 11, bold: true, color: { rgb: '3730A3' } },
          fill: { fgColor: { rgb: 'E0E7FF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });
      }
      // 2학기 배너 (Col 4, 5, 6)
      for (let c = 4; c <= 6; c++) {
        const ref = XLSX.utils.encode_cell({ r: bannerR, c });
        if (!ws[ref]) ws[ref] = { v: '' };
        ExcelStyler.applyStyle(ws[ref], {
          font: { name: ExcelStyler.fontFamily, sz: 11, bold: true, color: { rgb: '065F46' } },
          fill: { fgColor: { rgb: 'D1FAE5' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });
      }

      // Row 9: 열 헤더 (colHeaderR)
      [0, 1, 2, 4, 5, 6].forEach(c => {
        const ref = XLSX.utils.encode_cell({ r: colHeaderR, c });
        if (!ws[ref]) ws[ref] = { v: '' };
        ExcelStyler.applyStyle(ws[ref], {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: softBorder
        });
      });

      // Row 5부터: 데이터 셀 스타일링
      for (let i = 0; i < maxDataRows; i++) {
        const rIdx = dataStartR + i;

        // 1학기 스타일링
        if (i < sem1Data.items.length) {
          const item1 = sem1Data.items[i];
          const theme1 = pastelGroupThemes[item1.gIdx % pastelGroupThemes.length];

          // Col 0: 그룹 셀
          const refG = XLSX.utils.encode_cell({ r: rIdx, c: 0 });
          if (!ws[refG]) ws[refG] = { v: '' };
          ExcelStyler.applyStyle(ws[refG], {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: theme1.headerText } },
            fill: { fgColor: { rgb: theme1.headerBg } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: softBorder
          });

          // Col 1: 과목명 셀
          const refS = XLSX.utils.encode_cell({ r: rIdx, c: 1 });
          if (!ws[refS]) ws[refS] = { v: '' };
          ExcelStyler.applyStyle(ws[refS], {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '0F172A' } },
            fill: { fgColor: { rgb: theme1.subBg } },
            alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
            border: softBorder
          });

          // Col 2: 수강 인원 셀
          const refC = XLSX.utils.encode_cell({ r: rIdx, c: 2 });
          if (!ws[refC]) ws[refC] = { v: '' };
          ExcelStyler.applyStyle(ws[refC], {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: theme1.headerText } },
            fill: { fgColor: { rgb: 'FFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: softBorder
          });
        } else {
          // 빈 영역
          [0, 1, 2].forEach(c => {
            const ref = XLSX.utils.encode_cell({ r: rIdx, c });
            if (!ws[ref]) ws[ref] = { v: '' };
            ExcelStyler.applyStyle(ws[ref], {
              fill: { fgColor: { rgb: 'FAFAFA' } },
              border: softBorder
            });
          });
        }

        // 2학기 스타일링
        if (i < sem2Data.items.length) {
          const item2 = sem2Data.items[i];
          const theme2 = pastelGroupThemes[item2.gIdx % pastelGroupThemes.length];

          // Col 4: 그룹 셀
          const refG = XLSX.utils.encode_cell({ r: rIdx, c: 4 });
          if (!ws[refG]) ws[refG] = { v: '' };
          ExcelStyler.applyStyle(ws[refG], {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: theme2.headerText } },
            fill: { fgColor: { rgb: theme2.headerBg } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: softBorder
          });

          // Col 5: 과목명 셀
          const refS = XLSX.utils.encode_cell({ r: rIdx, c: 5 });
          if (!ws[refS]) ws[refS] = { v: '' };
          ExcelStyler.applyStyle(ws[refS], {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '0F172A' } },
            fill: { fgColor: { rgb: theme2.subBg } },
            alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
            border: softBorder
          });

          // Col 6: 수강 인원 셀
          const refC = XLSX.utils.encode_cell({ r: rIdx, c: 6 });
          if (!ws[refC]) ws[refC] = { v: '' };
          ExcelStyler.applyStyle(ws[refC], {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: theme2.headerText } },
            fill: { fgColor: { rgb: 'FFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: softBorder
          });
        } else {
          // 빈 영역
          [4, 5, 6].forEach(c => {
            const ref = XLSX.utils.encode_cell({ r: rIdx, c });
            if (!ws[ref]) ws[ref] = { v: '' };
            ExcelStyler.applyStyle(ws[ref], {
              fill: { fgColor: { rgb: 'FAFAFA' } },
              border: softBorder
            });
          });
        }
      }

      // 합계 행 스타일링 (summaryR)
      [0, 1, 2].forEach(c => {
        const ref = XLSX.utils.encode_cell({ r: summaryR, c });
        if (!ws[ref]) ws[ref] = { v: '' };
        ExcelStyler.applyStyle(ws[ref], {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '1E3A8A' } },
          fill: { fgColor: { rgb: 'EEF2FF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: summaryBorder
        });
      });

      [4, 5, 6].forEach(c => {
        const ref = XLSX.utils.encode_cell({ r: summaryR, c });
        if (!ws[ref]) ws[ref] = { v: '' };
        ExcelStyler.applyStyle(ws[ref], {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '065F46' } },
          fill: { fgColor: { rgb: 'ECFDF5' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: summaryBorder
        });
      });

      XLSX.utils.book_append_sheet(wb, ws, customSheetName.substring(0, 31));
    }

    // Helper to build Combined 1st & 2nd Semester Placement Sheet (한 페이지에 1,2학기 배치표 동시 확인)
    function buildCombinedPlacementSheet(wb, plan1, plan2, customSheetName = '1,2학기_배치표') {
      const acadYearStr = MultiState?.activeAcademicYear || '2027학년도';
      const gradeStr = AppState.detectedGrade || MultiState?.activeGrade || '3학년';

      const groups1 = (plan1 && plan1.groups) ? plan1.groups : [];
      const groups2 = (plan2 && plan2.groups) ? plan2.groups : [];

      const pastelGroupThemes = [
        { headerBg: 'DBEAFE', headerText: '1E40AF', subBg: 'EFF6FF', subText: '1E40AF', border: '93C5FD' },
        { headerBg: 'CCFBF1', headerText: '0F766E', subBg: 'F0FDFA', subText: '0F766E', border: '5EEAD4' },
        { headerBg: 'EDE9FE', headerText: '5B21B6', subBg: 'F5F3FF', subText: '5B21B6', border: 'C4B5FD' },
        { headerBg: 'FFEDD5', headerText: '9A3412', subBg: 'FFF7ED', subText: '9A3412', border: 'FDBA74' },
        { headerBg: 'FEF3C7', headerText: '92400E', subBg: 'FFFBEB', subText: '92400E', border: 'FCD34D' },
        { headerBg: 'FFE4E6', headerText: '9F1239', subBg: 'FFF1F2', subText: '9F1239', border: 'FDA4AF' },
        { headerBg: 'E0E7FF', headerText: '3730A3', subBg: 'EEF2FF', subText: '3730A3', border: 'A5B4FC' },
        { headerBg: 'D1FAE5', headerText: '065F46', subBg: 'ECFDF5', subText: '065F46', border: '6EE7B7' }
      ];

      const softBorder = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      const totalCols = Math.max(groups1.length, groups2.length, 1);
      const rows = [];
      const merges = [];
      const rowHeights = [];

      // Row 0: Sheet Title
      const titleRow = [`${acadYearStr} ${gradeStr} 1·2학기 과목 그룹핑 통합 배치표`];
      for (let c = 1; c < totalCols; c++) titleRow.push('');
      rows.push(titleRow);
      merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } });
      rowHeights.push({ hpt: 34 });

      // Row 1: Subtitle
      const subTitleRow = [`출력일시: ${new Date().toLocaleString()}`];
      for (let c = 1; c < totalCols; c++) subTitleRow.push('');
      rows.push(subTitleRow);
      merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } });
      rowHeights.push({ hpt: 20 });

      // Row 2: Spacer
      rows.push([]);
      rowHeights.push({ hpt: 10 });

      // --- SECTION 1: 1학기 과목 그룹핑 배치표 ---
      const sem1BannerR = rows.length;
      const sem1BannerText = `📘 [1학기] 과목 그룹핑 배치표 (총 ${groups1.length}개 그룹)`;
      const sem1BannerRow = [sem1BannerText];
      for (let c = 1; c < totalCols; c++) sem1BannerRow.push('');
      rows.push(sem1BannerRow);
      merges.push({ s: { r: sem1BannerR, c: 0 }, e: { r: sem1BannerR, c: totalCols - 1 } });
      rowHeights.push({ hpt: 26 });

      // 1학기 그룹 헤더행
      const sem1HeaderR = rows.length;
      const sem1HeaderRow = [];
      for (let gIdx = 0; gIdx < totalCols; gIdx++) {
        if (gIdx < groups1.length) {
          sem1HeaderRow.push(`${gIdx + 1}그룹`);
        } else {
          sem1HeaderRow.push('');
        }
      }
      rows.push(sem1HeaderRow);
      rowHeights.push({ hpt: 28 });

      // 1학기 과목 데이터행들 ('[교과군] 과목명' 형식 적용!)
      const maxLen1 = groups1.length > 0 ? Math.max(...groups1.map(g => g.length), 0) : 0;
      const sem1DataStartR = rows.length;
      const len1 = Math.max(maxLen1, 1);
      for (let r = 0; r < len1; r++) {
        const row = [];
        for (let gIdx = 0; gIdx < totalCols; gIdx++) {
          if (groups1.length === 0) {
            row.push(r === 0 ? '(1학기 배치 데이터 없음)' : '');
          } else if (gIdx < groups1.length) {
            const rawSubj = groups1[gIdx][r] || '';
            const displaySubj = rawSubj ? formatSubjectWithCategory(rawSubj, gradeStr) : '';
            row.push(displaySubj);
          } else {
            row.push('');
          }
        }
        rows.push(row);
        rowHeights.push({ hpt: 24 });
      }

      // Section Spacer between Sem 1 and Sem 2 (2행)
      rows.push([]);
      rowHeights.push({ hpt: 14 });
      rows.push([]);
      rowHeights.push({ hpt: 10 });

      // --- SECTION 2: 2학기 과목 그룹핑 배치표 ---
      const sem2BannerR = rows.length;
      const sem2BannerText = `📗 [2학기] 과목 그룹핑 배치표 (총 ${groups2.length}개 그룹)`;
      const sem2BannerRow = [sem2BannerText];
      for (let c = 1; c < totalCols; c++) sem2BannerRow.push('');
      rows.push(sem2BannerRow);
      merges.push({ s: { r: sem2BannerR, c: 0 }, e: { r: sem2BannerR, c: totalCols - 1 } });
      rowHeights.push({ hpt: 26 });

      // 2학기 그룹 헤더행
      const sem2HeaderR = rows.length;
      const sem2HeaderRow = [];
      for (let gIdx = 0; gIdx < totalCols; gIdx++) {
        if (gIdx < groups2.length) {
          sem2HeaderRow.push(`${gIdx + 1}그룹`);
        } else {
          sem2HeaderRow.push('');
        }
      }
      rows.push(sem2HeaderRow);
      rowHeights.push({ hpt: 28 });

      // 2학기 과목 데이터행들 ('[교과군] 과목명' 형식 적용!)
      const maxLen2 = groups2.length > 0 ? Math.max(...groups2.map(g => g.length), 0) : 0;
      const sem2DataStartR = rows.length;
      const len2 = Math.max(maxLen2, 1);
      for (let r = 0; r < len2; r++) {
        const row = [];
        for (let gIdx = 0; gIdx < totalCols; gIdx++) {
          if (groups2.length === 0) {
            row.push(r === 0 ? '(2학기 배치 데이터 없음)' : '');
          } else if (gIdx < groups2.length) {
            const rawSubj = groups2[gIdx][r] || '';
            const displaySubj = rawSubj ? formatSubjectWithCategory(rawSubj, gradeStr) : '';
            row.push(displaySubj);
          } else {
            row.push('');
          }
        }
        rows.push(row);
        rowHeights.push({ hpt: 24 });
      }

      // --- SECTION 3: 메모가 있는 경우 하단에 포함 ---
      const memo1 = (plan1 && plan1.memo ? plan1.memo.trim() : '');
      const memo2 = (plan2 && plan2.memo ? plan2.memo.trim() : '');
      let memoBannerR = -1;
      let memoContentR = -1;
      if (memo1 || memo2) {
        rows.push([]);
        rowHeights.push({ hpt: 14 });

        memoBannerR = rows.length;
        const memoBannerRow = ['📝 [시간표 작업 메모 및 특이사항]'];
        for (let c = 1; c < totalCols; c++) memoBannerRow.push('');
        rows.push(memoBannerRow);
        merges.push({ s: { r: memoBannerR, c: 0 }, e: { r: memoBannerR, c: totalCols - 1 } });
        rowHeights.push({ hpt: 24 });

        const memoContentParts = [];
        if (memo1) memoContentParts.push(`[1학기 메모]\n${memo1}`);
        if (memo2) memoContentParts.push(`[2학기 메모]\n${memo2}`);
        memoContentR = rows.length;
        const memoContentRow = [memoContentParts.join('\n\n')];
        for (let c = 1; c < totalCols; c++) memoContentRow.push('');
        rows.push(memoContentRow);
        merges.push({ s: { r: memoContentR, c: 0 }, e: { r: memoContentR, c: totalCols - 1 } });
        rowHeights.push({ hpt: 60 });
      }

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!merges'] = merges;
      ws['!rows'] = rowHeights;

      // Set uniform column widths (과목명 + 교과군 고려하여 wch: 28로 넉넉하게 설정)
      const placeCols = [];
      for (let c = 0; c < totalCols; c++) {
        placeCols.push({ wch: 28 });
      }
      ws['!cols'] = placeCols;

      // Styling Title & Subtitle
      ExcelStyler.setRange(ws, 0, 0, 0, totalCols - 1, {
        font: { name: ExcelStyler.fontFamily, sz: 14, bold: true, color: { rgb: '1E3A8A' } },
        fill: { fgColor: { rgb: 'EEF2FF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: softBorder
      });
      ExcelStyler.setRange(ws, 1, 0, 1, totalCols - 1, {
        font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: '64748B' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: softBorder
      });

      // Styling Section 1 Banner
      ExcelStyler.setRange(ws, sem1BannerR, 0, sem1BannerR, totalCols - 1, {
        font: { name: ExcelStyler.fontFamily, sz: 11, bold: true, color: { rgb: '1E3A8A' } },
        fill: { fgColor: { rgb: 'E0E7FF' } },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        border: softBorder
      });

      // Styling Section 1 Headers
      for (let gIdx = 0; gIdx < totalCols; gIdx++) {
        const gTheme = pastelGroupThemes[gIdx % pastelGroupThemes.length];
        if (gIdx < groups1.length) {
          ExcelStyler.setCell(ws, sem1HeaderR, gIdx, {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: gTheme.headerText } },
            fill: { fgColor: { rgb: gTheme.headerBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: gTheme.border } },
              bottom: { style: 'medium', color: { rgb: gTheme.border } },
              left: { style: 'thin', color: { rgb: 'CBD5E1' } },
              right: { style: 'thin', color: { rgb: 'CBD5E1' } }
            }
          });
        } else {
          ExcelStyler.setCell(ws, sem1HeaderR, gIdx, {
            fill: { fgColor: { rgb: 'F8FAFC' } },
            border: softBorder
          });
        }
      }

      // Styling Section 1 Data Cells (왼쪽 정렬 horizontal: 'left', indent: 1 적용!)
      for (let r = 0; r < len1; r++) {
        const isEven = r % 2 === 1;
        for (let gIdx = 0; gIdx < totalCols; gIdx++) {
          const val = groups1[gIdx] ? groups1[gIdx][r] : '';
          ExcelStyler.setCell(ws, sem1DataStartR + r, gIdx, {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: !!val, color: { rgb: val ? '0F172A' : '94A3B8' } },
            fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
            alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
            border: softBorder
          });
        }
      }

      // Styling Section 2 Banner
      ExcelStyler.setRange(ws, sem2BannerR, 0, sem2BannerR, totalCols - 1, {
        font: { name: ExcelStyler.fontFamily, sz: 11, bold: true, color: { rgb: '065F46' } },
        fill: { fgColor: { rgb: 'DCFCE7' } },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
        border: softBorder
      });

      // Styling Section 2 Headers
      for (let gIdx = 0; gIdx < totalCols; gIdx++) {
        const gTheme = pastelGroupThemes[gIdx % pastelGroupThemes.length];
        if (gIdx < groups2.length) {
          ExcelStyler.setCell(ws, sem2HeaderR, gIdx, {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: gTheme.headerText } },
            fill: { fgColor: { rgb: gTheme.headerBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: gTheme.border } },
              bottom: { style: 'medium', color: { rgb: gTheme.border } },
              left: { style: 'thin', color: { rgb: 'CBD5E1' } },
              right: { style: 'thin', color: { rgb: 'CBD5E1' } }
            }
          });
        } else {
          ExcelStyler.setCell(ws, sem2HeaderR, gIdx, {
            fill: { fgColor: { rgb: 'F8FAFC' } },
            border: softBorder
          });
        }
      }

      // Styling Section 2 Data Cells (왼쪽 정렬 horizontal: 'left', indent: 1 적용!)
      for (let r = 0; r < len2; r++) {
        const isEven = r % 2 === 1;
        for (let gIdx = 0; gIdx < totalCols; gIdx++) {
          const val = groups2[gIdx] ? groups2[gIdx][r] : '';
          ExcelStyler.setCell(ws, sem2DataStartR + r, gIdx, {
            font: { name: ExcelStyler.fontFamily, sz: 10, bold: !!val, color: { rgb: val ? '0F172A' : '94A3B8' } },
            fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
            alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
            border: softBorder
          });
        }
      }

      // Styling Section 3 Memo
      if (memo1 || memo2) {
        ExcelStyler.setRange(ws, memoBannerR, 0, memoBannerR, totalCols - 1, {
          font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: '1E3A8A' } },
          fill: { fgColor: { rgb: 'EEF2FF' } },
          alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
          border: softBorder
        });
        ExcelStyler.setRange(ws, memoContentR, 0, memoContentR, totalCols - 1, {
          font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: 'F8FAFC' } },
          alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
          border: softBorder
        });
      }

      XLSX.utils.book_append_sheet(wb, ws, customSheetName);
    }

    function buildStyledPlanSheets(wb, plan, idx) {
      const sem = plan.semester || AppState.currentSemester || 1;
      buildTimetableSheet(wb, plan, `${sem}학기_${idx + 1}안_학생시간표`);
      buildPlacementSheet(wb, plan, `${sem}학기_${idx + 1}안_배치표`);
    }

    window.exportSinglePlanExcel = function(planId) {
      let plan = AppState.savedPlans.find(p => p.id === planId || String(p.id) === String(planId));
      if (!plan && (planId === 'current' || !planId || (AppState.currentPlan && (AppState.currentPlan.id === planId || String(AppState.currentPlan.id) === String(planId))))) {
        plan = AppState.currentPlan;
      }
      if (!plan && AppState.currentPlan) {
        plan = AppState.currentPlan;
      }
      if (!plan || !plan.groups || plan.groups.length === 0) {
        alert('다운로드할 저장안 또는 현재 배치 정보를 찾을 수 없습니다. 먼저 그룹핑을 실행해주세요.');
        return;
      }

      if (plan === AppState.currentPlan) {
        const memoTextarea = document.getElementById('planWorkMemo');
        if (memoTextarea) {
          plan.memo = memoTextarea.value;
        }
      }

      const sem = plan.semester || AppState.currentSemester || 1;
      const planName = plan.name || `${sem}학기 현재배치 (충돌 ${plan.conflictCount || 0}명)`;

      try {
        const wb = XLSX.utils.book_new();
        const exportPlanObj = Object.assign({}, plan, { name: planName });
        buildStyledPlanSheets(wb, exportPlanObj, 0);

        const serializedState = JSON.stringify({
          detectedGrade: AppState.detectedGrade,
          students: AppState.students,
          sem1Subjects: AppState.sem1Subjects,
          sem2Subjects: AppState.sem2Subjects,
          sem1GroupCount: AppState.sem1GroupCount,
          sem2GroupCount: AppState.sem2GroupCount,
          splitSubjects: AppState.splitSubjects,
          pinnedSubjects: AppState.pinnedSubjects,
          studentPins: AppState.studentPins,
          savedPlans: [exportPlanObj]
        });
        const wsState = XLSX.utils.aoa_to_sheet([[serializedState]]);
        XLSX.utils.book_append_sheet(wb, wsState, '_APP_STATE');

        const acadYearStr = MultiState?.activeAcademicYear || '2027학년도';
        const gradeStr = AppState.detectedGrade || MultiState?.activeGrade || '3학년';
        const outFileName = buildExportFileName(`${acadYearStr} ${gradeStr} ${sem}학기 학생별 그룹 시간표`, "xlsx");
        window.saveExcelFile(wb, outFileName);
        alert(`📥 [${planName}] 엑셀 파일이 다운로드되었습니다!\n(${outFileName})`);
      } catch (err) {
        console.error('exportSinglePlanExcel error:', err);
        alert(`엑셀 파일 생성 중 오류가 발생했습니다: ${err.message || err}`);
      }
    };

    // Export Current Plan Directly as Formatted Excel:
    // 선생님 요청 서식: 1학기_배치안_학생시간표 / 2학기_배치안_학생시간표 / 1,2학기_배치표 통합 시트 구성
    window.exportCurrentPlanExcel = async function() {
      // 1. 최신 작업 메모 동기화
      const memoTextarea = document.getElementById('planWorkMemo');
      if (memoTextarea && AppState.currentPlan) {
        AppState.currentPlan.memo = memoTextarea.value;
      }

      // 2. 1학기 및 2학기 활성 배치안 가져오기
      let plan1 = getActivePlanForSemester(1);
      let plan2 = getActivePlanForSemester(2);

      if (AppState.currentSemester === 1 && AppState.currentPlan && isPlanValidForCurrentGrade(AppState.currentPlan, 1)) {
        plan1 = AppState.currentPlan;
      }
      if (AppState.currentSemester === 2 && AppState.currentPlan && isPlanValidForCurrentGrade(AppState.currentPlan, 2)) {
        plan2 = AppState.currentPlan;
      }

      const hasPlan1 = plan1 && plan1.groups && plan1.groups.length > 0;
      const hasPlan2 = plan2 && plan2.groups && plan2.groups.length > 0;

      if (!hasPlan1 && !hasPlan2) {
        alert('다운로드할 현재 배치안이 없습니다. 먼저 2단계에서 과목 그룹 배치를 진행해 주세요.');
        return;
      }

      const acadYearStr = MultiState?.activeAcademicYear || '2027학년도';
      const gradeStr = AppState.detectedGrade || MultiState?.activeGrade || '3학년';

      try {
        const wb = XLSX.utils.book_new();
        const exportedTabNames = [];

        // 0. Sheet 0: 1·2학기_과목배치_및_인원안내 (학생 배포 및 출력용 통합 요약 안내표)
        if (hasPlan1 || hasPlan2) {
          buildSummaryTimetableSheet(wb, plan1, plan2, '1·2학기_과목배치_및_인원안내');
          exportedTabNames.push('1·2학기_과목배치_및_인원안내');
        }

        // 1. Sheet 1: 1학기_배치안_학생시간표
        if (hasPlan1) {
          buildTimetableSheet(wb, plan1, '1학기_배치안_학생시간표');
          exportedTabNames.push('1학기_배치안_학생시간표');
        }

        // 2. Sheet 2: 2학기_배치안_학생시간표
        if (hasPlan2) {
          buildTimetableSheet(wb, plan2, '2학기_배치안_학생시간표');
          exportedTabNames.push('2학기_배치안_학생시간표');
        }

        // 3. Sheet 3: 1,2학기_배치표 (한 페이지에 1학기와 2학기 배치 동시 표시)
        buildCombinedPlacementSheet(wb, plan1, plan2, '1,2학기_배치표');
        exportedTabNames.push('1,2학기_배치표');

        // 4. Sheet 4: _APP_STATE 메타데이터 시트 (추후 100% 복원용)
        const serializedState = JSON.stringify({
          detectedGrade: AppState.detectedGrade,
          students: AppState.students,
          sem1Subjects: AppState.sem1Subjects,
          sem2Subjects: AppState.sem2Subjects,
          sem1GroupCount: AppState.sem1GroupCount,
          sem2GroupCount: AppState.sem2GroupCount,
          splitSubjects: AppState.splitSubjects,
          pinnedSubjects: AppState.pinnedSubjects,
          studentPins: AppState.studentPins,
          savedPlans: [plan1, plan2].filter(Boolean)
        });
        const wsState = XLSX.utils.aoa_to_sheet([[serializedState]]);
        XLSX.utils.book_append_sheet(wb, wsState, '_APP_STATE');

        const outFileName = buildExportFileName(`${acadYearStr} ${gradeStr} 1·2학기 통합 시간표 및 배치표`, "xlsx");
        const saveRes = await window.saveExcelFile(wb, outFileName);

        if (saveRes && saveRes.cancelled) return;
        let locMsg = "브라우저 기본 다운로드 폴더";
        if (saveRes && saveRes.method === "directory") locMsg = `지정된 [${saveRes.dirName}] 폴더`;
        else if (saveRes && saveRes.method === "picker") locMsg = "선택하신 저장 폴더";
        alert(`📥 [${acadYearStr} ${gradeStr} 1·2학기 현재 배치 저장 완료!]\n\n저장 위치: ${locMsg}\n생성된 엑셀 시트 탭 목록:\n- ${exportedTabNames.join("\n- ")}\n\n저장 파일명: ${outFileName}`);
      } catch (err) {
        console.error('exportCurrentPlanExcel error:', err);
        alert(`엑셀 파일 생성 중 오류가 발생했습니다: ${err.message || err}`);
      }
    };


        // COMBINED EXCEL EXPORT (Contains all saved plans formatted neatly)
    btnExportAllPlans.addEventListener('click', () => {
      exportCombinedExcel();
    });

    function exportCombinedExcel() {
      if (AppState.savedPlans.length === 0 && AppState.currentPlan) {
        // Auto-save current active plan as 1st proposal
        const sem = AppState.currentPlan.semester;
        const { groupCounts, studentGroupOverlaps } = analyzeGroupConflicts(AppState.currentPlan);
        AppState.savedPlans.push({
          id: Date.now(),
          name: `${sem}학기 1안 (충돌 ${AppState.currentPlan.conflictCount}명)`,
          semester: sem,
          groupCount: AppState.currentPlan.groups.length,
          groups: JSON.parse(JSON.stringify(AppState.currentPlan.groups)),
          conflictCount: AppState.currentPlan.conflictCount,
          conflicts: JSON.parse(JSON.stringify(AppState.currentPlan.conflicts)),
          groupCounts: JSON.parse(JSON.stringify(groupCounts)),
          studentGroupOverlaps: JSON.parse(JSON.stringify(studentGroupOverlaps)),
          customAssignments: JSON.parse(JSON.stringify(AppState.currentPlan.customAssignments || {})),
          memo: AppState.currentPlan.memo || '',
          splitConfig: JSON.parse(JSON.stringify(AppState.splitSubjects[sem] || {})),
          pinnedConfig: JSON.parse(JSON.stringify(AppState.pinnedSubjects[sem] || {})),
          timestamp: new Date().toLocaleTimeString()
        });
        renderSavedPlansList();
      }

      if (AppState.savedPlans.length === 0) {
        alert('저장된 배치 안이 없습니다. 먼저 그룹핑 안을 생성하거나 저장해주세요.');
        return;
      }

      const wb = XLSX.utils.book_new();

      // Add Student Timetable Sheet & Placement Sheet for each saved plan
      AppState.savedPlans.forEach((plan, idx) => {
        buildStyledPlanSheets(wb, plan, idx);
      });

      // EMBED HIDDEN METADATA SHEET FOR RESTORATION ON RE-UPLOAD!
      const serializedState = JSON.stringify({
        detectedGrade: AppState.detectedGrade,
        students: AppState.students,
        sem1Subjects: AppState.sem1Subjects,
        sem2Subjects: AppState.sem2Subjects,
        sem1GroupCount: AppState.sem1GroupCount,
        sem2GroupCount: AppState.sem2GroupCount,
        splitSubjects: AppState.splitSubjects,
        pinnedSubjects: AppState.pinnedSubjects,
        studentPins: AppState.studentPins,
        savedPlans: AppState.savedPlans
      });

      const wsState = XLSX.utils.aoa_to_sheet([[serializedState]]);
      XLSX.utils.book_append_sheet(wb, wsState, '_APP_STATE');

      const outFileName = buildExportFileName(`${AppState.detectedGrade} 선택과목 그룹핑 최종결과`, "xlsx");
      window.saveExcelFile(wb, outFileName);
      alert(`📥 엑셀 파일이 다운로드되었습니다!\n(${outFileName})\n\n💡 이 파일을 나중에 다시 웹앱에 업로드하면 이전 작업 상태가 그대로 복원됩니다.`);
    }

    // ==========================================
    // 2.5 GROUP IMPORT FROM OTHER REFERENCE DATES (그룹 불러오기)
    // ==========================================

    // ==========================================
    // STEP 2 CONTEXT MEMO & IMPORT FUNCTIONALITY
    // ==========================================
    function updateStep2ContextMemoUI() {
      const memoTextarea = document.getElementById('step2ContextMemo');
      const badge = document.getElementById('step2MemoContextBadge');
      if (!memoTextarea) return;

      const curSem = AppState.currentSemester || 1;
      const curGrade = MultiState.activeGrade || '2학년';

      if (badge) {
        badge.textContent = `${curGrade} ${curSem}학기`;
      }

      if (!AppState.step2Memos) AppState.step2Memos = { 1: '', 2: '' };
      memoTextarea.value = AppState.step2Memos[curSem] || '';
    }
    window.updateStep2ContextMemoUI = updateStep2ContextMemoUI;

    document.getElementById('step2ContextMemo')?.addEventListener('input', (e) => {
      const sem = AppState.currentSemester || 1;
      if (!AppState.step2Memos) AppState.step2Memos = { 1: '', 2: '' };
      AppState.step2Memos[sem] = e.target.value;

      const hint = document.getElementById('step2MemoSavedHint');
      if (hint) {
        hint.classList.remove('hidden');
        clearTimeout(hint._timer);
        hint._timer = setTimeout(() => hint.classList.add('hidden'), 2000);
      }
      saveAllState();
    });

    let selectedImportMemoDate = null;

    window.openImportMemoModal = function() {
      const activeGrade = MultiState.activeGrade || '2학년';
      const activeSem = AppState.currentSemester || 1;
      const currentYear = MultiState.activeYear;
      const currentAY = MultiState.activeAcademicYear || '2027학년도';

      const badge = document.getElementById('importMemoContextBadge');
      if (badge) badge.textContent = `${currentAY} ${activeGrade} ${activeSem}학기`;

      const subInfo = document.getElementById('importMemoSubInfo');
      if (subInfo) subInfo.textContent = `[${activeGrade} ${activeSem}학기]`;

      const otherYears = (MultiState.yearsList || []).filter(y => y !== currentYear);
      const dateListContainer = document.getElementById('importMemoDateList');
      const previewContainer = document.getElementById('importMemoPreviewContainer');
      const confirmBtn = document.getElementById('btnConfirmApplyImportedMemo');

      if (!dateListContainer) return;

      if (otherYears.length === 0) {
        dateListContainer.innerHTML = `<p class="text-xs text-slate-400 py-2">동일 학년도 내에 다른 기준 날짜가 없습니다. 상단 '기준 날짜: + 추가'로 다른 기준 날짜를 추가해주세요.</p>`;
        if (previewContainer) previewContainer.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">불러올 수 있는 다른 기준 날짜가 없습니다.</p>`;
        if (confirmBtn) {
          confirmBtn.disabled = true;
          confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        document.getElementById('importMemoModal')?.classList.remove('hidden');
        return;
      }

      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }

      selectedImportMemoDate = otherYears[0];
      renderImportMemoDateButtons();
      renderImportMemoPreview();

      document.getElementById('importMemoModal')?.classList.remove('hidden');
    };

    window.closeImportMemoModal = function() {
      document.getElementById('importMemoModal')?.classList.add('hidden');
    };

    function renderImportMemoDateButtons() {
      const currentYear = MultiState.activeYear;
      const activeGrade = MultiState.activeGrade || '2학년';
      const activeSem = AppState.currentSemester || 1;
      const container = document.getElementById('importMemoDateList');
      if (!container) return;

      const acadData = getAcadData();

      container.innerHTML = MultiState.yearsList.map(y => {
        const isCurrent = (y === currentYear);
        const isSelected = (y === selectedImportMemoDate);
        const yData = acadData[y]?.[activeGrade];
        const memoText = (yData?.step2Memos?.[activeSem] || '').trim();
        const hasMemo = Boolean(memoText);

        return `
          <button type="button" 
                  onclick="window.selectImportMemoDate('${escapeHtml(y)}')"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                      : (isCurrent ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-300')
                  }">
            <span>${escapeHtml(y)}</span>
            ${isCurrent ? '<span class="text-[10px] px-1 py-0.2 rounded bg-slate-200 text-slate-600">현재</span>' : ''}
            ${hasMemo ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500" title="작성된 메모 있음"></span>' : '<span class="text-[10px] text-slate-300 font-normal">(비어있음)</span>'}
          </button>
        `;
      }).join('');
    }

    window.selectImportMemoDate = function(dateStr) {
      selectedImportMemoDate = dateStr;
      renderImportMemoDateButtons();
      renderImportMemoPreview();
    };

    function renderImportMemoPreview() {
      const preview = document.getElementById('importMemoPreviewContainer');
      const lengthBadge = document.getElementById('importMemoLengthBadge');
      if (!preview) return;

      const acadData = getAcadData();
      const activeGrade = MultiState.activeGrade || '2학년';
      const activeSem = AppState.currentSemester || 1;
      const yData = acadData[selectedImportMemoDate]?.[activeGrade];
      const memoText = (yData?.step2Memos?.[activeSem] || '').trim();

      if (lengthBadge) {
        lengthBadge.textContent = memoText ? `${memoText.length}자` : '내용 없음';
      }

      if (memoText) {
        preview.textContent = memoText;
        preview.className = 'bg-white border border-purple-200 rounded-xl p-3.5 min-h-[140px] max-h-[220px] overflow-y-auto text-xs text-slate-800 whitespace-pre-wrap font-sans';
      } else {
        preview.innerHTML = `<span class="text-slate-400 italic">[${selectedImportMemoDate}]의 [${activeGrade} ${activeSem}학기]에 작성된 메모가 없습니다.</span>`;
        preview.className = 'bg-slate-50 border border-slate-200 rounded-xl p-3.5 min-h-[140px] max-h-[220px] overflow-y-auto text-xs text-slate-500 whitespace-pre-wrap font-sans flex items-center justify-center';
      }
    }

    window.applyImportedMemo = function() {
      if (!selectedImportMemoDate) return;
      const acadData = getAcadData();
      const activeGrade = MultiState.activeGrade || '2학년';
      const activeSem = AppState.currentSemester || 1;
      const yData = acadData[selectedImportMemoDate]?.[activeGrade];
      const memoText = yData?.step2Memos?.[activeSem] || '';

      const currentMemo = (AppState.step2Memos?.[activeSem] || '').trim();
      if (currentMemo && currentMemo !== memoText.trim()) {
        const curShort = currentMemo.length > 30 ? currentMemo.substring(0, 30) + '...' : currentMemo;
        const newShort = memoText.length > 30 ? memoText.substring(0, 30) + '...' : memoText;
        if (!confirm(`현재 작성 중인 메모를 [${selectedImportMemoDate}]의 메모로 덮어쓰시겠습니까?\n\n- 현재 메모: ${curShort}\n- 불러올 메모: ${newShort || '(비어있음)'}`)) {
          return;
        }
      }

      if (!AppState.step2Memos) AppState.step2Memos = { 1: '', 2: '' };
      AppState.step2Memos[activeSem] = memoText;

      const memoTextarea = document.getElementById('step2ContextMemo');
      if (memoTextarea) {
        memoTextarea.value = memoText;
      }

      saveAllState();
      window.closeImportMemoModal();

      alert(`✅ [${selectedImportMemoDate}]의 ${activeGrade} ${activeSem}학기 메모를 성공적으로 불러왔습니다!`);
    };


    let selectedImportDate = null;
    let selectedImportPlanId = 'active';
    let previewGroupsData = null;

    window.openImportGroupModal = function() {
      const activeGrade = MultiState.activeGrade || '2학년';
      const activeSem = AppState.currentSemester || 1;
      const currentYear = MultiState.activeYear;

      const badge = document.getElementById('importGroupContextBadge');
      if (badge) badge.textContent = `${activeGrade} · ${activeSem}학기`;

      const otherYears = MultiState.yearsList.filter(y => y !== currentYear);
      const dateListContainer = document.getElementById('importGroupDateList');
      const previewContainer = document.getElementById('importGroupPreviewContainer');
      const confirmBtn = document.getElementById('btnConfirmApplyImportedGroup');

      if (!dateListContainer) return;

      if (MultiState.yearsList.length <= 1) {
        dateListContainer.innerHTML = `<p class="text-xs text-slate-400 py-2">등록된 다른 기준 날짜가 없습니다. 상단 '기준 날짜: + 추가'로 다른 기준 날짜를 추가해주세요.</p>`;
        if (previewContainer) previewContainer.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">선택할 기준 날짜가 없습니다.</p>`;
        if (confirmBtn) {
          confirmBtn.disabled = true;
          confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        document.getElementById('importGroupModal')?.classList.remove('hidden');
        return;
      }

      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }

      // 가장 최근에 생성된 기준 날짜(otherYears의 마지막 항목)를 기본값으로 선택
      selectedImportDate = otherYears.length > 0 ? otherYears[otherYears.length - 1] : MultiState.yearsList[0];
      selectedImportPlanId = 'active_sem';

      renderImportGroupDateButtons();
      renderImportGroupPlansAndPreview();

      const modal = document.getElementById('importGroupModal');
      if (modal) modal.classList.remove('hidden');
    };

    window.closeImportGroupModal = function() {
      const modal = document.getElementById('importGroupModal');
      if (modal) modal.classList.add('hidden');
    };

    function renderImportGroupDateButtons() {
      const currentYear = MultiState.activeYear;
      const container = document.getElementById('importGroupDateList');
      if (!container) return;

      container.innerHTML = MultiState.yearsList.map(y => {
        const isCurrent = (y === currentYear);
        const isSelected = (y === selectedImportDate);
        return `
          <button type="button" 
                  onclick="window.selectImportGroupDate('${escapeHtml(y)}')"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                      : (isCurrent ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-300')
                  }">
            <span>${escapeHtml(y)}</span>
            ${isCurrent ? '<span class="text-[10px] px-1 py-0.2 rounded bg-slate-200 text-slate-600">현재</span>' : ''}
          </button>
        `;
      }).join('');
    }

    window.selectImportGroupDate = function(y) {
      selectedImportDate = y;
      selectedImportPlanId = 'active';
      renderImportGroupDateButtons();
      renderImportGroupPlansAndPreview();
    };

    function renderImportGroupPlansAndPreview() {
      const activeGrade = MultiState.activeGrade || '2학년';
      const activeSem = AppState.currentSemester || 1;
      const targetYearData = getAcadData()[selectedImportDate]?.[activeGrade];

      const planContainer = document.getElementById('importGroupPlanSelectContainer');
      const previewContainer = document.getElementById('importGroupPreviewContainer');
      const summaryInfo = document.getElementById('importGroupSummaryInfo');
      const confirmBtn = document.getElementById('btnConfirmApplyImportedGroup');

      if (!targetYearData) {
        if (previewContainer) previewContainer.innerHTML = `<p class="text-xs text-rose-500 text-center py-6">선택한 기준 날짜 [${selectedImportDate}]에 [${activeGrade}] 데이터가 없습니다.</p>`;
        if (summaryInfo) summaryInfo.textContent = '';
        if (confirmBtn) {
          confirmBtn.disabled = true;
          confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        previewGroupsData = null;
        return;
      }

      // 1. 계획 목록 추출: 현재 학기(activeSem)에 정확히 일치하는 배치안만 수집 (학기 교차 오염 100% 방지)
      const availablePlans = [];

      // A. 대상 기준 날짜의 currentPlans[activeSem] 확인 (가장 정확한 해당 학기 기본 활성 배치안)
      const semActivePlan = targetYearData.currentPlans?.[activeSem];
      if (semActivePlan && semActivePlan.groups && semActivePlan.groups.length > 0) {
        availablePlans.push({
          id: 'active_sem',
          name: `기본 활성 배치안 (${activeSem}학기)`,
          semester: activeSem,
          groups: semActivePlan.groups,
          conflictCount: semActivePlan.conflictCount || 0
        });
      }

      // B. 대상 기준 날짜의 currentPlan 확인 (학기가 activeSem과 일치하고 아직 추가되지 않은 경우)
      if (targetYearData.currentPlan && targetYearData.currentPlan.groups && targetYearData.currentPlan.groups.length > 0) {
        const curPlanSem = targetYearData.currentPlan.semester || 1;
        if (curPlanSem === activeSem && !availablePlans.some(p => p.id === 'active_sem')) {
          availablePlans.push({
            id: 'active',
            name: `기본 활성 배치안 (${activeSem}학기)`,
            semester: activeSem,
            groups: targetYearData.currentPlan.groups,
            conflictCount: targetYearData.currentPlan.conflictCount || 0
          });
        }
      }

      // C. 대상 기준 날짜의 savedPlans 중 현재 학기(activeSem)에 저장된 안들 추가
      if (targetYearData.savedPlans && Array.isArray(targetYearData.savedPlans)) {
        targetYearData.savedPlans.forEach(p => {
          if (p.groups && p.groups.length > 0) {
            const pSem = p.semester || 1;
            if (pSem === activeSem) {
              availablePlans.push({
                id: p.id,
                name: p.name || `저장된 안 (${activeSem}학기)`,
                semester: activeSem,
                groups: p.groups,
                conflictCount: p.conflictCount || 0
              });
            }
          }
        });
      }

      // 2. 현재 학기(activeSem)에 해당하는 배치안이 전혀 없는 경우
      if (availablePlans.length === 0) {
        if (previewContainer) {
          previewContainer.innerHTML = `<div class="text-center py-8 text-slate-400 space-y-1.5">
            <p class="text-xs font-bold text-slate-700">[${selectedImportDate}]의 [${activeGrade} ${activeSem}학기]에 생성된 그룹 배치 데이터가 없습니다.</p>
            <p class="text-[11px] text-slate-500">해당 기준 날짜로 이동하여 [${activeGrade} ${activeSem}학기] 2단계에서 그룹을 먼저 생성해주세요.</p>
          </div>`;
        }
        if (summaryInfo) summaryInfo.textContent = '';
        if (planContainer) planContainer.classList.add('hidden');
        if (confirmBtn) {
          confirmBtn.disabled = true;
          confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        previewGroupsData = null;
        return;
      }

      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }

      // 3. 배치안 선택 기본값 처리 (저장한 안이 없는 경우에도 기본 활성 배치안이 즉시 기본값으로 선택됨)
      const validPlanExists = availablePlans.some(p => String(p.id) === String(selectedImportPlanId));
      if (!validPlanExists) {
        selectedImportPlanId = availablePlans[0].id;
      }

      // 배치안 다중 선택 UI 렌더링
      if (availablePlans.length > 1) {
        if (planContainer) {
          planContainer.classList.remove('hidden');
          const planListDiv = document.getElementById('importGroupPlanList');
          if (planListDiv) {
            planListDiv.innerHTML = availablePlans.map(p => {
              const isSelected = (String(p.id) === String(selectedImportPlanId));
              return `
                <button type="button" 
                        onclick="window.selectImportGroupPlan('${p.id}')"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-purple-100 text-purple-800 border-purple-400 ring-2 ring-purple-300 shadow-2xs' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }">
                  <span>${escapeHtml(p.name)}</span>
                  <span class="text-[10px] text-slate-400 font-normal">(${p.groups.length}그룹)</span>
                </button>
              `;
            }).join('');
          }
        }
      } else {
        if (planContainer) planContainer.classList.add('hidden');
        selectedImportPlanId = availablePlans[0].id;
      }

      const chosenPlan = availablePlans.find(p => String(p.id) === String(selectedImportPlanId)) || availablePlans[0];
      previewGroupsData = chosenPlan.groups;

      // 현재 학년의 학생 수강신청 조사 과목 목록 (과목 일치 여부 비교)
      const currentSemSubjs = (activeSem === 1 ? AppState.sem1Subjects : AppState.sem2Subjects) || [];
      const currentSubjSet = new Set(currentSemSubjs.map(s => normalizeSubject(s)));

      let totalImportCourses = 0;
      let matchedCourses = 0;

      previewContainer.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          ${previewGroupsData.map((grp, gIdx) => {
            totalImportCourses += grp.length;
            return `
              <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
                <div class="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span class="text-xs font-black text-slate-800 flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>${gIdx + 1}그룹</span>
                  </span>
                  <span class="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    ${grp.length}과목
                  </span>
                </div>
                <div class="flex flex-wrap gap-1">
                  ${grp.map(subj => {
                    const isKnown = currentSubjSet.has(normalizeSubject(subj));
                    if (isKnown) matchedCourses++;
                    return `
                      <span class="text-[11px] px-2 py-0.5 rounded-md font-bold border transition ${
                        isKnown 
                          ? 'bg-blue-50 text-blue-800 border-blue-200' 
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }" title="${isKnown ? '현재 수강신청 조사 과목과 일치' : '현재 수강신청 조사에 없는 과목'}">
                        ${escapeHtml(subj)}
                        ${!isKnown ? '<span class="text-[9px] text-amber-600">⚠️</span>' : ''}
                      </span>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      if (summaryInfo) {
        summaryInfo.textContent = `총 ${previewGroupsData.length}개 그룹 · ${totalImportCourses}개 과목 (현재 일치: ${matchedCourses}개)`;
      }
    }

        window.selectImportGroupPlan = function(pId) {
      selectedImportPlanId = pId;
      renderImportGroupPlansAndPreview();
    };

    window.confirmApplyImportedGroup = function() {
      if (!previewGroupsData || previewGroupsData.length === 0) {
        alert('적용할 그룹 데이터가 없습니다.');
        return;
      }

      const activeGrade = MultiState.activeGrade || '2학년';
      const activeSem = AppState.currentSemester || 1;

      if (!confirm(`[${selectedImportDate}]의 ${activeGrade} ${activeSem}학기 [${previewGroupsData.length}개 그룹] 배치를 현재 화면에 적용하시겠습니까?\n\n- 현재 화면의 그룹 및 과목 배치가 대체됩니다.\n- 적용 후 학생들의 시간표 및 충돌 인원이 즉시 재계산됩니다.`)) {
        return;
      }

      // AppState.currentPlan 업데이트
      if (!AppState.currentPlan) {
        AppState.currentPlan = {
          id: Date.now(),
          semester: activeSem,
          groups: [],
          conflicts: [],
          conflictCount: 0,
          customAssignments: {},
          memo: '',
          timestamp: new Date().toLocaleTimeString()
        };
      }

      // 그룹 깊은 복사 및 현재 학년 1단계 과목명 표기와 일치하도록 정규화 매핑 (예: '여행지리' -> '여행 지리' 또는 그 반대)
      const currentSemSubjs = (activeSem === 1 ? AppState.sem1Subjects : AppState.sem2Subjects) || [];
      const harmonizedGroups = previewGroupsData.map(grp => {
        return grp.map(token => {
          const matchSplit = String(token || '').match(/^(.*)-([A-Z])$/);
          const base = matchSplit ? matchSplit[1] : token;
          const letter = matchSplit ? `-${matchSplit[2]}` : '';
          const normBase = normalizeSubject(base);
          const found = currentSemSubjs.find(s => normalizeSubject(s) === normBase);
          if (found) {
            return `${found}${letter}`;
          }
          return token;
        });
      });

      AppState.currentPlan.groups = harmonizedGroups;
      AppState.currentPlan.semester = activeSem;
      AppState.currentPlan.timestamp = new Date().toLocaleTimeString();

      // 그룹 수 설정 동기화
      if (activeSem === 1) {
        AppState.sem1GroupCount = previewGroupsData.length;
      } else {
        AppState.sem2GroupCount = previewGroupsData.length;
      }
      const groupCountInput = document.getElementById('groupCountInput');
      if (groupCountInput) groupCountInput.value = previewGroupsData.length;

      // 충돌 재분석 및 렌더링
      const analysis = analyzeGroupConflicts(AppState.currentPlan);
      AppState.currentPlan.conflictCount = analysis.conflictStudentCount;
      AppState.currentPlan.conflicts = analysis.conflictDetails;

      if (!AppState.currentPlans) AppState.currentPlans = { 1: null, 2: null };
      AppState.currentPlans[activeSem] = AppState.currentPlan;

      renderStep2Results();
      saveAllState();

      window.closeImportGroupModal();

      alert(`✅ [${selectedImportDate}]의 그룹 배치가 성공적으로 적용되었습니다!\n- 배치 그룹: 총 ${previewGroupsData.length}개 그룹\n- 충돌 인원: ${analysis.conflictStudentCount}명`);
    };

    // ==========================================
    // STEP 2: MANUAL SUBJECT ADDITION & DELETION (2단계 과목 추가 및 그룹 삭제)
    // ==========================================

    window.openAddSubjectModal = function() {
      const plan = AppState.currentPlan;
      if (!plan || !plan.groups || plan.groups.length === 0) {
        alert('현재 학기에 생성된 그룹 배치가 없습니다. 2단계 조합을 먼저 생성해주세요.');
        return;
      }

      const activeGrade = MultiState.activeGrade || '2학년';
      const activeSem = AppState.currentSemester || 1;
      const currentAY = MultiState.activeAcademicYear || '2027학년도';

      const badge = document.getElementById('addSubjectContextBadge');
      if (badge) badge.textContent = `${currentAY} ${activeGrade} ${activeSem}학기`;

      const input = document.getElementById('addSubjectNameInput');
      if (input) input.value = '';

      const select = document.getElementById('addSubjectGroupSelect');
      if (select) {
        select.innerHTML = plan.groups.map((grp, gIdx) => {
          return `<option value="${gIdx}">${gIdx + 1}그룹 (현재 ${grp.length}개 과목 개설)</option>`;
        }).join('');
      }

      // Suggest unassigned subjects from Step 1
      const suggestionsDiv = document.getElementById('addSubjectSuggestions');
      if (suggestionsDiv) {
        const rawSubjects = (activeSem === 1 ? AppState.sem1Subjects : AppState.sem2Subjects) || [];
        const assignedTokens = new Set(plan.groups.flat().map(t => normalizeSubject(t.replace(/-[A-Z]$/, ''))));
        const unassigned = rawSubjects.filter(s => !assignedTokens.has(normalizeSubject(s)));

        if (unassigned.length > 0) {
          suggestionsDiv.innerHTML = `
            <span class="text-[11px] text-slate-400 font-semibold mr-1">미배치 과목 추천:</span>
            ${unassigned.slice(0, 8).map(s => `
              <button type="button" onclick="document.getElementById('addSubjectNameInput').value = '${escapeHtml(s)}'" class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-teal-100 hover:text-teal-800 text-slate-600 border border-slate-200 transition cursor-pointer">
                ${escapeHtml(s)}
              </button>
            `).join('')}
          `;
        } else {
          suggestionsDiv.innerHTML = '';
        }
      }

      const modal = document.getElementById('addSubjectModal');
      if (modal) modal.classList.remove('hidden');
      setTimeout(() => input?.focus(), 50);
    };

    window.closeAddSubjectModal = function() {
      const modal = document.getElementById('addSubjectModal');
      if (modal) modal.classList.add('hidden');
    };

    window.confirmAddNewSubject = function() {
      const input = document.getElementById('addSubjectNameInput');
      const select = document.getElementById('addSubjectGroupSelect');
      if (!input || !select) return;

      const rawName = input.value.trim();
      if (!rawName) {
        alert('추가할 과목명을 입력해주세요.');
        input.focus();
        return;
      }

      // Remove unwanted leading stars or symbols if entered
      const cleanName = rawName.replace(/^[*※★☆\s]+/, '').trim();
      if (!cleanName) {
        alert('올바른 과목명을 입력해주세요.');
        input.focus();
        return;
      }

      const gIdx = parseInt(select.value, 10);
      const plan = AppState.currentPlan;
      if (!plan || !plan.groups || !plan.groups[gIdx]) {
        alert('배치할 그룹을 찾을 수 없습니다.');
        return;
      }

      const sem = AppState.currentSemester || 1;
      let baseSubj = cleanName.replace(/-[A-Z]$/, '').replace(/\(신설\)/g, '').trim();

      const curSemSubjs = (sem === 1 ? AppState.sem1Subjects : AppState.sem2Subjects) || [];
      const normBase = normalizeSubject(baseSubj);
      const isAlreadyInSem = curSemSubjs.some(s => normalizeSubject(s) === normBase);
      const curClosed = AppState.closedSubjects?.[sem] || [];
      const isClosedInCurrent = curClosed.some(s => normalizeSubject(s) === normBase);

      // 과목명 뒤에 '(신설)'을 붙이지 않고 원본 과목명 그대로 유지 (기존 등록 과목이 있으면 표준 명칭 사용)
      const existingSemSubj = curSemSubjs.find(s => normalizeSubject(s) === normBase);
      let finalBaseName = existingSemSubj ? existingSemSubj.replace(/\(신설\)/g, '').trim() : baseSubj;
      if (existingSemSubj && existingSemSubj !== finalBaseName) {
        const idx = curSemSubjs.indexOf(existingSemSubj);
        if (idx !== -1) curSemSubjs[idx] = finalBaseName;
      }

      const normNew = normalizeSubject(finalBaseName);

      // Check if same subject already exists in this target group
      const alreadyInThisGroup = plan.groups[gIdx].some(s => normalizeSubject(s.replace(/-[A-Z]$/, '')) === normNew);
      if (alreadyInThisGroup) {
        alert(`⚠️ [${finalBaseName}] 과목은 이미 ${gIdx + 1}그룹에 배치되어 있습니다.`);
        return;
      }

      // Check if subject exists in other group (section duplicate check)
      const existingInOtherGroup = plan.groups.findIndex((grp, i) => i !== gIdx && grp.some(s => normalizeSubject(s.replace(/-[A-Z]$/, '')) === normNew));
      let tokenToAdd = finalBaseName;
      if (existingInOtherGroup !== -1) {
        if (confirm(`ℹ️ [${finalBaseName}] 과목은 이미 ${existingInOtherGroup + 1}그룹에 개설되어 있습니다.\n\n동일 과목을 ${gIdx + 1}그룹에도 개설하여 분반으로 운영하시겠습니까?\n('확인' 클릭 시 분반 추가, '취소' 클릭 시 작업 중단)`)) {
          const existingLetters = [];
          plan.groups.flat().forEach(t => {
            const m = t.match(/^(.*)-([A-Z])$/);
            if (m && normalizeSubject(m[1]) === normNew) {
              existingLetters.push(m[2]);
            }
          });
          const nextLetter = String.fromCharCode(65 + existingLetters.length);
          tokenToAdd = `${finalBaseName}-${nextLetter}`;
        } else {
          return;
        }
      }

      // 1. 2단계 currentPlan 그룹에 추가
      plan.groups[gIdx].push(tokenToAdd);
      if (!AppState.currentPlans) AppState.currentPlans = { 1: null, 2: null };
      AppState.currentPlans[sem] = plan;

      // 2. 1단계 semSubjects에 없으면 추가 반영
      if (!curSemSubjs.some(s => normalizeSubject(s) === normNew)) {
        curSemSubjs.push(finalBaseName);
        curSemSubjs.sort((a, b) => a.localeCompare(b, 'ko'));
        if (sem === 1) AppState.sem1Subjects = curSemSubjs;
        else AppState.sem2Subjects = curSemSubjs;
      }

      // 2-1. 폐강 보류 및 비고 메모에 신설 이력 자동 기록
      if (isClosedInCurrent || !isAlreadyInSem) {
        if (!AppState.subjectMemos) AppState.subjectMemos = { 1: {}, 2: {} };
        if (!AppState.subjectMemos[sem]) AppState.subjectMemos[sem] = {};
        const activeDateStr = MultiState.activeYear || '';
        const memoText = activeDateStr ? `[${activeDateStr} 2단계 과목 신설]` : '[2단계 과목 신설]';
        if (!AppState.subjectMemos[sem][finalBaseName]) {
          AppState.subjectMemos[sem][finalBaseName] = memoText;
        } else if (!AppState.subjectMemos[sem][finalBaseName].includes('신설')) {
          AppState.subjectMemos[sem][finalBaseName] = `${AppState.subjectMemos[sem][finalBaseName]} ${memoText}`.trim();
        }
      }

      // 2-2. 신설/재개설 과목은 폐강이 아니므로 현재 학기 closedSubjects에서 제외 보장
      if (AppState.closedSubjects?.[sem]) {
        AppState.closedSubjects[sem] = AppState.closedSubjects[sem].filter(s => normalizeSubject(s) !== normNew);
      }

      // 3. 충돌 재분석 및 렌더링
      const analysis = analyzeGroupConflicts(plan);
      plan.conflictCount = analysis.conflictStudentCount;
      plan.conflicts = analysis.conflictDetails;

      // 4. 전체 상태 보존 (3단계 및 4단계 전체 탭 연동을 위해 MultiState.data에 동기화)
      saveAllState();

      // 5. 1단계 및 2단계 UI 재렌더링
      renderStep1();
      renderStep2Results();

      window.closeAddSubjectModal();

      const noteMsg = isClosedInCurrent
        ? `\n\n📌 안내: 현재 학기에 폐강 확정 상태였던 [${finalBaseName}] 과목의 폐강 체크가 해제되고 신설 개설로 전환되었으며, 1단계 비고 메모에 신설 이력이 자동 기록되었습니다.`
        : '';
      alert(`✅ [${tokenToAdd}] 과목이 ${gIdx + 1}그룹에 성공적으로 추가되었습니다!\n\n- 2단계 그룹 카드 및 개인별 이동수업 시간표에 즉시 반영되었습니다.\n- 1단계 현황표(신설 뱃지 및 비고 이력) 및 전체 교육과정 편제표에도 함께 반영되었습니다.${noteMsg}\n- 이제 하단 시간표에서 학생 셀을 클릭하여 자유롭게 수강 선택·수정할 수 있습니다.`);
    };

    window.removeSubjectFromGroup = function(sName, gIdx) {
      const plan = AppState.currentPlan;
      if (!plan || !plan.groups || !plan.groups[gIdx]) return;
      const sem = plan.semester || AppState.currentSemester || 1;

      if (!confirm(`[${sName}] 과목을 ${gIdx + 1}그룹에서 삭제하시겠습니까?\n(그룹에서 과목이 제거되며 학생들의 시간표가 다시 계산됩니다)`)) {
        return;
      }

      // Remove from group
      plan.groups[gIdx] = plan.groups[gIdx].filter(s => s !== sName);

      // Clean pinned if any
      const parentName = sName.replace(/-[A-Z]$/, '');
      if (AppState.pinnedSubjects?.[sem]?.[parentName]) {
        delete AppState.pinnedSubjects[sem][parentName];
      }

      // Recalculate
      const analysis = analyzeGroupConflicts(plan);
      plan.conflictCount = analysis.conflictStudentCount;
      plan.conflicts = analysis.conflictDetails;

      if (!AppState.currentPlans) AppState.currentPlans = { 1: null, 2: null };
      AppState.currentPlans[sem] = plan;

      saveAllState();
      renderStep2Results();
    };

            // Loading helpers
    function showLoading(msg) {
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) {
        if (msg) document.getElementById('loadingMsg').textContent = msg;
        overlay.classList.remove('hidden');
      }
    }
    function hideLoading() {
      const overlay = document.getElementById('loadingOverlay');
      if (overlay) overlay.classList.add('hidden');
    }
    
    // ==========================================
    // GOOGLE FORM COURSE SELECTION GENERATOR
    // ==========================================
    let currentGoogleFormData = null;

    function getActivePlanForSemester(sem) {
      if (AppState.currentPlans && AppState.currentPlans[sem] && isPlanValidForCurrentGrade(AppState.currentPlans[sem], sem)) {
        return AppState.currentPlans[sem];
      }
      if (AppState.currentSemester === sem && AppState.currentPlan && isPlanValidForCurrentGrade(AppState.currentPlan, sem)) {
        return AppState.currentPlan;
      }
      const validSaved = (AppState.savedPlans || []).filter(p => p.semester === sem && isPlanValidForCurrentGrade(p, sem));
      if (validSaved.length > 0) {
        return validSaved[validSaved.length - 1];
      }
      if (AppState.currentPlan && AppState.currentPlan.semester === sem) {
        return AppState.currentPlan;
      }
      return null;
    }

    window.openCreateGoogleFormModal = function() {
      const acadYearStr = window.getAcademicYear ? window.getAcademicYear() : '2027';
      const gradeStr = AppState.detectedGrade || '3학년';

      const plan1 = getActivePlanForSemester(1);
      const plan2 = getActivePlanForSemester(2);

      const sem1Groups = (plan1 && plan1.groups) ? plan1.groups.filter(g => g && g.length > 0) : [];
      const sem2Groups = (plan2 && plan2.groups) ? plan2.groups.filter(g => g && g.length > 0) : [];

      if (sem1Groups.length === 0 && sem2Groups.length === 0) {
        alert('현재 배치된 과목 그룹이 없습니다. 먼저 2단계에서 과목 그룹 배치를 진행해 주세요.');
        return;
      }

      currentGoogleFormData = {
        year: acadYearStr,
        grade: gradeStr,
        title: `${acadYearStr}학년도 ${gradeStr} 선택과목 수강신청`,
        description: '상지대관령고등학교 학생 여러분, 각 학기별 선택과목군을 확인하고 그룹별로 수강할 과목을 1개씩 신중하게 선택해 주세요.\n※ 제출 후 수정이 불가하므로 자신의 진로와 적성을 고려하여 선택 바랍니다.',
        sem1Groups: sem1Groups,
        sem2Groups: sem2Groups
      };

      document.getElementById('gfHeaderBadge').textContent = `${acadYearStr}학년도 ${gradeStr}`;
      document.getElementById('gfTitleInput').value = currentGoogleFormData.title;
      document.getElementById('gfDescInput').value = currentGoogleFormData.description;

      // 1학기 렌더링
      const s1Container = document.getElementById('gfSem1QuestionsContainer');
      document.getElementById('gfSem1HeaderTitle').textContent = `[1학기] 총 ${sem1Groups.length}개 선택과목군 질문`;
      document.getElementById('gfSem1GroupCountBadge').textContent = `${sem1Groups.length}개 그룹`;
      s1Container.innerHTML = '';
      if (sem1Groups.length === 0) {
        s1Container.innerHTML = '<p class="text-slate-400 italic p-2 bg-white rounded-xl border border-slate-200">1학기 배치 데이터가 없습니다. (1학기 탭에서 배치 후 추가 가능)</p>';
      } else {
        sem1Groups.forEach((grp, idx) => {
          const qCard = document.createElement('div');
          qCard.className = 'bg-white p-2.5 rounded-xl border border-blue-200/80 shadow-2xs space-y-1.5';
          qCard.innerHTML = `
            <div class="flex items-center justify-between">
              <span class="font-bold text-blue-900">[1학기] ${sem1Groups.length}개 선택과목 중 - ${idx + 1}번째 선택과목 <span class="text-rose-500 font-black">*</span></span>
              <span class="text-[10px] text-slate-400 font-semibold">객관식 질문 (택 1)</span>
            </div>
            <div class="flex flex-wrap gap-1.5 pt-0.5">
              ${grp.map(s => `<span class="px-2 py-0.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 border border-blue-200">${s}</span>`).join('')}
            </div>
          `;
          s1Container.appendChild(qCard);
        });
      }

      // 2학기 렌더링
      const s2Container = document.getElementById('gfSem2QuestionsContainer');
      document.getElementById('gfSem2HeaderTitle').textContent = `[2학기] 총 ${sem2Groups.length}개 선택과목군 질문`;
      document.getElementById('gfSem2GroupCountBadge').textContent = `${sem2Groups.length}개 그룹`;
      s2Container.innerHTML = '';
      if (sem2Groups.length === 0) {
        s2Container.innerHTML = '<p class="text-slate-400 italic p-2 bg-white rounded-xl border border-slate-200">2학기 배치 데이터가 없습니다. (2학기 탭에서 배치 후 추가 가능)</p>';
      } else {
        sem2Groups.forEach((grp, idx) => {
          const qCard = document.createElement('div');
          qCard.className = 'bg-white p-2.5 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1.5';
          qCard.innerHTML = `
            <div class="flex items-center justify-between">
              <span class="font-bold text-emerald-900">[2학기] ${sem2Groups.length}개 선택과목 중 - ${idx + 1}번째 선택과목 <span class="text-rose-500 font-black">*</span></span>
              <span class="text-[10px] text-slate-400 font-semibold">객관식 질문 (택 1)</span>
            </div>
            <div class="flex flex-wrap gap-1.5 pt-0.5">
              ${grp.map(s => `<span class="px-2 py-0.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">${s}</span>`).join('')}
            </div>
          `;
          s2Container.appendChild(qCard);
        });
      }

      // Hide success card
      document.getElementById('gfSuccessResultCard').classList.add('hidden');

      const modal = document.getElementById('createGoogleFormModal');
      modal.classList.remove('hidden');
    };

    window.closeCreateGoogleFormModal = function() {
      const modal = document.getElementById('createGoogleFormModal');
      if (modal) modal.classList.add('hidden');
    };

    window.executeCreateGoogleForm = function() {
      if (!currentGoogleFormData) return;
      currentGoogleFormData.title = document.getElementById('gfTitleInput').value.trim() || currentGoogleFormData.title;
      currentGoogleFormData.description = document.getElementById('gfDescInput').value.trim() || currentGoogleFormData.description;

      if (!isGasEnv) {
        // 로컬 환경 안내 및 자동 복사 + Apps Script 사이트 이동
        const confirmCopy = confirm(
          '현재 파일은 일반 웹 브라우저(로컬)에서 열려 있어 구글 드라이브에 직접 생성할 수 없습니다.\n\n' +
          '[확인]을 누르시면 완성형 Apps Script 코드를 클립보드에 바로 복사하고 Google Apps Script(https://script.google.com/home)로 이동합니다.\n' +
          '복사 후 이동하시겠습니까?'
        );
        if (confirmCopy) {
          window.copyGoogleFormAppsScript(true);
        }
        return;
      }

      showLoading('구글 폼 설문지 및 응답 스프레드시트를 생성하는 중...');

      google.script.run
        .withSuccessHandler(res => {
          hideLoading();
          if (res && res.success) {
            document.getElementById('gfPublishedUrlText').textContent = res.publishedUrl;
            document.getElementById('gfPublishedUrlLink').href = res.publishedUrl;
            document.getElementById('gfEditUrlText').textContent = res.editUrl;
            document.getElementById('gfEditUrlLink').href = res.editUrl;
            document.getElementById('gfSheetUrlText').textContent = res.spreadsheetUrl;
            document.getElementById('gfSheetUrlLink').href = res.spreadsheetUrl;

            document.getElementById('gfSuccessResultCard').classList.remove('hidden');
            document.getElementById('gfSuccessResultCard').scrollIntoView({ behavior: 'smooth' });
            alert('🎉 구글 폼 생성 완료!\n\n학생 배포용 링크와 교사용 관리 링크가 생성되었습니다.');
          } else {
            alert('구글 폼 생성 실패: ' + (res ? res.message : '알 수 없는 오류'));
          }
        })
        .withFailureHandler(err => {
          hideLoading();
          alert('구글 폼 생성 오류: ' + err);
        })
        .createGoogleFormForCourseSelection(currentGoogleFormData);
    };

    window.copyGfLink = function(type) {
      let url = '';
      if (type === 'published') {
        url = document.getElementById('gfPublishedUrlText').textContent;
      } else if (type === 'edit') {
        url = document.getElementById('gfEditUrlText').textContent;
      }
      if (!url) return;
      navigator.clipboard.writeText(url).then(() => {
        alert('링크가 클립보드에 복사되었습니다!\n' + url);
      }).catch(() => {
        prompt('Ctrl+C를 눌러 링크를 복사하세요:', url);
      });
    };

    window.copyGoogleFormAppsScript = function(openScriptHome = false) {
      if (!currentGoogleFormData) return;
      const title = document.getElementById('gfTitleInput')?.value.trim() || currentGoogleFormData.title;
      const desc = document.getElementById('gfDescInput')?.value.trim() || currentGoogleFormData.description;

      const sem1Json = JSON.stringify(currentGoogleFormData.sem1Groups, null, 2);
      const sem2Json = JSON.stringify(currentGoogleFormData.sem2Groups, null, 2);

      const scriptContent = `/**
 * 상지대관령고등학교 선택과목 수강신청 구글 폼 자동 생성 매크로
 * [실행 방법]: Google Apps Script (새 프로젝트) 또는 구글 스프레드시트 -> 확장 프로그램 -> Apps Script -> 붙여넣기 후 [실행] 클릭!
 */
function createSangjiCourseSelectionForm() {
  var title = ${JSON.stringify(title)};
  var description = ${JSON.stringify(desc)};
  
  // 1. 구글 폼 생성
  var form = FormApp.create(title);
  form.setTitle(title);
  form.setDescription(description);
  form.setAllowResponseEdits(false);

  // 2. 기본 인적사항 질문 (선생님 요청 형식)
  // 1) 반 (숫자만 입력)
  var classItem = form.addTextItem();
  classItem.setTitle('반 (숫자만 입력)').setRequired(true);
  classItem.setValidation(FormApp.createTextValidation().setHelpText('숫자만 입력해 주세요.').requireWholeNumber().build());

  // 2) 번호 (숫자만 입력)
  var numItem = form.addTextItem();
  numItem.setTitle('번호 (숫자만 입력)').setRequired(true);
  numItem.setValidation(FormApp.createTextValidation().setHelpText('숫자만 입력해 주세요.').requireWholeNumber().build());

  // 3) 이름
  var nameItem = form.addTextItem();
  nameItem.setTitle('이름').setRequired(true);

  // 4) 진로, 관심학과
  var careerItem = form.addTextItem();
  careerItem.setTitle('진로, 관심학과').setHelpText('*진로 미정인 경우: 탐색중').setRequired(true);

  // 3. 1학기 선택과목군 질문 생성
  var sem1Groups = ${sem1Json};
  if (sem1Groups.length > 0) {
    var total1 = sem1Groups.length;
    sem1Groups.forEach(function(grp, idx) {
      if (!grp || grp.length === 0) return;
      var item = form.addMultipleChoiceItem();
      item.setTitle('[1학기] ' + total1 + '개 선택과목 중 - ' + (idx + 1) + '번째 선택과목').setRequired(true);
      item.setChoiceValues(grp);
    });
  }

  // 4. 2학기 선택과목군 질문 생성
  var sem2Groups = ${sem2Json};
  if (sem2Groups.length > 0) {
    var total2 = sem2Groups.length;
    sem2Groups.forEach(function(grp, idx) {
      if (!grp || grp.length === 0) return;
      var item = form.addMultipleChoiceItem();
      item.setTitle('[2학기] ' + total2 + '개 선택과목 중 - ' + (idx + 1) + '번째 선택과목').setRequired(true);
      item.setChoiceValues(grp);
    });
  }

  // 5. 응답 수집용 구글 스프레드시트 생성 및 연결
  var responseSs = SpreadsheetApp.create(title + ' (설문 응답 결과)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, responseSs.getId());

  Logger.log('🎉 구글 폼 생성 완료!');
  Logger.log('🎓 학생용 응답 링크: ' + form.getPublishedUrl());
  Logger.log('🛠️ 교사용 편집 링크: ' + form.getEditUrl());
  Logger.log('📊 응답 스프레드시트: ' + responseSs.getUrl());
}
`;

      const openAppsScriptSite = () => {
        if (openScriptHome) {
          window.open('https://script.google.com/home', '_blank', 'noopener,noreferrer');
        }
      };

      navigator.clipboard.writeText(scriptContent).then(() => {
        alert('📋 구글 폼 자동 생성용 Apps Script 코드가 클립보드에 복사되었습니다!\n\n[사용 방법]\n1. Google Apps Script 화면에서 [+ 새 프로젝트] 클릭\n2. 기존 코드를 지우고 붙여넣기(Ctrl+V) 후 [저장(Ctrl+S)] -> [실행] 클릭!');
        openAppsScriptSite();
      }).catch(() => {
        prompt('Ctrl+C를 눌러 아래 코드를 복사하세요:', scriptContent);
        openAppsScriptSite();
      });
    };

    
    // ==========================================
    // STANDALONE HTML TIMETABLE VIEWER EXPORT
    // ==========================================
    function generateHtmlViewerContent(data) {
      return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.schoolName} - ${data.acadYear} ${data.grade} ${data.currentSemester}학기 학생별 이동수업 시간표</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", sans-serif; background: #f8fafc; color: #1e293b; padding: 20px; line-height: 1.5; }
    .container { max-width: 1440px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
    
    /* Header - Soft Pastel Palette */
    header { background: linear-gradient(135deg, #f0f7ff 0%, #e0e7ff 100%); color: #1e293b; padding: 22px 28px; border-bottom: 2px solid #c7d2fe; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .title-area h1 { font-size: 20px; font-weight: 800; color: #1e3a8a; display: flex; align-items: center; gap: 8px; }
    .title-area p { font-size: 13px; color: #475569; margin-top: 4px; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .badge-school { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-blue { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-green { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .badge-red { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

    /* Controls Bar */
    .controls-bar { padding: 16px 24px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px; }
    .controls-row1 { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .sem-switch { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; gap: 4px; }
    .sem-btn { border: none; background: transparent; padding: 6px 16px; font-size: 13px; font-weight: 700; color: #64748b; border-radius: 8px; cursor: pointer; transition: all 0.15s; }
    .sem-btn.active { background: #ffffff; color: #1e40af; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    .action-btns { display: flex; gap: 8px; }
    .btn { padding: 8px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; border: 1px solid transparent; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .btn-print { background: #1e293b; color: white; }
    .btn-print:hover { background: #334155; }
    .btn-reset { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
    .btn-reset:hover { background: #e2e8f0; }

    /* Filters Row */
    .filter-grid { display: grid; grid-template-columns: 2fr 1.5fr 3fr auto; gap: 12px; align-items: center; }
    @media (max-width: 900px) { .filter-grid { grid-template-columns: 1fr; } }
    .search-input-wrap { position: relative; }
    .search-input { width: 100%; padding: 8px 12px 8px 32px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; transition: border-color 0.15s; }
    .search-input:focus { border-color: #2563eb; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #94a3b8; }
    .class-pills { display: flex; gap: 4px; flex-wrap: wrap; }
    .class-pill { border: 1px solid #cbd5e1; background: #ffffff; padding: 5px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; color: #475569; transition: all 0.15s; }
    .class-pill.active { background: #2563eb; color: #ffffff; border-color: #2563eb; }
    .chk-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; white-space: nowrap; }

    /* Result Info Bar */
    .info-bar { padding: 10px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
    .highlight { background: #fef08a; padding: 0 2px; border-radius: 2px; }

    /* Timetable Table */
    .table-wrap { overflow-x: auto; max-height: calc(100vh - 280px); }
    table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12px; text-align: center; }
    thead th { position: sticky; top: 0; z-index: 10; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #e2e8f0; padding: 10px 6px; font-weight: 700; color: #334155; }
    thead tr:first-child th { top: 0; background: #e2e8f0; color: #1e293b; font-size: 12.5px; }
    thead tr:nth-child(2) th { top: 40px; background: #f8fafc; font-size: 11px; padding: 6px 4px; border-bottom: 2px solid #94a3b8; }
    tbody td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #f1f5f9; vertical-align: middle; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    tbody tr:hover { background: #f0fdfa; }
    td.student-name { font-weight: 700; color: #0f172a; }
    td.student-career { text-align: left; padding-left: 10px; font-size: 11.5px; color: #475569; }
    td.conflict-row { background: #fef2f2 !important; }
    .subject-pill { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 700; background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
    .subject-pill.conflict { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
    .group-subjs-list { font-size: 10px; color: #64748b; font-weight: normal; line-height: 1.3; max-width: 140px; margin: 0 auto; }

    /* Print Styles */
    @media print {
      body { background: white; padding: 0; }
      .container { border: none; box-shadow: none; max-width: 100%; }
      header { background: #f8fafc !important; color: #1e293b !important; border-bottom: 1px solid #cbd5e1 !important; -webkit-print-color-adjust: exact; padding: 12px 16px; }
      .title-area h1 { color: #1e293b !important; }
      .controls-bar { display: none !important; }
      .table-wrap { max-height: none !important; overflow: visible !important; }
      table { font-size: 10px !important; }
      tbody td { padding: 4px 3px !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-top">
        <div class="title-area">
          <h1>
            <span>🏫</span>
            <span>${data.schoolName} - ${data.acadYear} ${data.grade} 학생별 이동수업 시간표</span>
          </h1>
          <p id="headerSubtitle">현재 학기: ${data.currentSemester}학기 | 대상 학생: ${data.students.length}명</p>
        </div>
        <div>
          <span class="badge badge-school">${data.schoolName}</span>
        </div>
      </div>
    </header>

    <div class="controls-bar">
      <div class="controls-row1">
        <div class="sem-switch" id="semSwitchArea">
          <button type="button" class="sem-btn ${data.currentSemester === 1 ? 'active' : ''}" id="btnSem1" onclick="switchSemester(1)">1학기 시간표</button>
          <button type="button" class="sem-btn ${data.currentSemester === 2 ? 'active' : ''}" id="btnSem2" onclick="switchSemester(2)">2학기 시간표</button>
        </div>
        <div class="action-btns">
          <button type="button" class="btn btn-reset" onclick="resetFilters()">🔄 필터 초기화</button>
          <button type="button" class="btn btn-print" onclick="window.print()">🖨️ 인쇄 / PDF 출력</button>
        </div>
      </div>

      <div class="filter-grid">
        <div class="search-input-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" id="nameFilter" class="search-input" placeholder="학생 이름 검색 (예: 홍길동)..." oninput="applyFilters()" autofocus>
        </div>
        <div class="class-pills" id="classPillsContainer">
          <!-- Class pills populated by JS -->
        </div>
        <div class="search-input-wrap">
          <span class="search-icon">🎯</span>
          <input type="text" id="careerFilter" class="search-input" placeholder="진로, 관심학과 검색 (예: 공학, 의학)..." oninput="applyFilters()">
        </div>
        <div>
          <label class="chk-label">
            <input type="checkbox" id="chkConflictOnly" onchange="applyFilters()">
            <span>⚠️ 중복/충돌만 보기</span>
          </label>
        </div>
      </div>
    </div>

    <div class="info-bar">
      <div id="resultCountBadge">조회 결과: ${data.students.length}명</div>
      <div id="conflictSummaryBadge" class="text-slate-500"></div>
    </div>

    <div class="table-wrap">
      <table id="timetableTable">
        <thead id="tableHead"></thead>
        <tbody id="tableBody"></tbody>
      </table>
    </div>
  </div>

  <script>
    const DATA = ${JSON.stringify(data)};
    let activeSem = DATA.currentSemester || 1;
    if (!DATA.plans || !DATA.plans[activeSem]) {
      activeSem = (DATA.plans && DATA.plans[1]) ? 1 : ((DATA.plans && DATA.plans[2]) ? 2 : 1);
    }
    let selectedClass = 'all';

    function initClassPills() {
      const classes = [...new Set(DATA.students.map(s => String(s.classNum)).filter(Boolean))].sort((a,b) => Number(a) - Number(b));
      const container = document.getElementById('classPillsContainer');
      container.innerHTML = '';

      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = 'class-pill active';
      allBtn.dataset.class = 'all';
      allBtn.textContent = '전체';
      allBtn.onclick = function() { selectClass('all'); };
      container.appendChild(allBtn);

      classes.forEach(c => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'class-pill';
        btn.dataset.class = c;
        btn.textContent = c + '반';
        btn.onclick = function() { selectClass(c); };
        container.appendChild(btn);
      });
    }

    function selectClass(c) {
      selectedClass = c;
      document.querySelectorAll('.class-pill').forEach(el => {
        el.classList.toggle('active', el.dataset.class === c);
      });
      applyFilters();
    }

    function switchSemester(sem) {
      if (!DATA.plans || !DATA.plans[sem] || !DATA.plans[sem].groups || DATA.plans[sem].groups.length === 0) {
        alert(sem + '학기 배치 데이터가 없습니다.');
        return;
      }
      activeSem = sem;
      const b1 = document.getElementById('btnSem1');
      const b2 = document.getElementById('btnSem2');
      if (b1) b1.classList.toggle('active', sem === 1);
      if (b2) b2.classList.toggle('active', sem === 2);
      renderTable();
      applyFilters();
    }

    function renderTable() {
      const plan = DATA.plans ? DATA.plans[activeSem] : null;
      const thead = document.getElementById('tableHead');
      if (!plan || !plan.groups) {
        thead.innerHTML = '<tr><th style="padding:20px;">해당 학기의 배치 데이터가 없습니다.</th></tr>';
        return;
      }

      const groups = plan.groups;
      
      let tr1 = '<tr>' +
        '<th rowspan="2" style="width:48px">반</th>' +
        '<th rowspan="2" style="width:48px">번호</th>' +
        '<th rowspan="2" style="width:80px">이름</th>' +
        '<th rowspan="2" style="width:150px">진로 / 관심학과</th>';
      
      groups.forEach((gSubjs, gIdx) => {
        tr1 += '<th>' + (gIdx + 1) + '그룹</th>';
      });
      tr1 += '<th rowspan="2" style="width:90px">배정 상태</th></tr>';

      let tr2 = '<tr>';
      groups.forEach((gSubjs) => {
        const listStr = Array.isArray(gSubjs) ? gSubjs.join(', ') : '';
        tr2 += '<th><div class="group-subjs-list">' + (listStr || '-') + '</div></th>';
      });
      tr2 += '</tr>';

      thead.innerHTML = tr1 + tr2;

      const subEl = document.getElementById('headerSubtitle');
      if (subEl) {
        subEl.textContent = DATA.acadYear + ' ' + DATA.grade + ' ' + activeSem + '학기 | 대상 학생: ' + DATA.students.length + '명 | 충돌: ' + (plan.conflictCount || 0) + '명';
      }
      
      const badgeEl = document.getElementById('conflictSummaryBadge');
      if (badgeEl) {
        badgeEl.textContent = '충돌 학생 수: ' + (plan.conflictCount || 0) + '명 (' + groups.length + '개 그룹)';
      }
    }

    function applyFilters() {
      const plan = DATA.plans ? DATA.plans[activeSem] : null;
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = '';
      if (!plan) return;

      const nameQ = (document.getElementById('nameFilter')?.value || '').trim().toLowerCase();
      const careerQ = (document.getElementById('careerFilter')?.value || '').trim().toLowerCase();
      const conflictOnly = !!document.getElementById('chkConflictOnly')?.checked;

      let matchCount = 0;

      DATA.students.forEach(st => {
        if (selectedClass !== 'all' && String(st.classNum) !== selectedClass) return;
        if (nameQ && !(st.name || '').toLowerCase().includes(nameQ)) return;
        if (careerQ && !(st.career || '').toLowerCase().includes(careerQ)) return;

        const overlaps = (plan.overlaps && plan.overlaps[st.id]) || {};
        let hasConflict = false;

        (plan.groups || []).forEach((_, gIdx) => {
          const inGrp = overlaps[gIdx] || [];
          if (inGrp.length > 1) hasConflict = true;
        });

        if (conflictOnly && !hasConflict) return;

        matchCount++;

        const tr = document.createElement('tr');
        if (hasConflict) tr.className = 'conflict-row';

        let rowHtml = '<td>' + (st.classNum || '-') + '</td>' +
          '<td>' + (st.studentNum || '-') + '</td>' +
          '<td class="student-name">' + highlightText(st.name || '', nameQ) + '</td>' +
          '<td class="student-career">' + highlightText(st.career || '-', careerQ) + '</td>';

        (plan.groups || []).forEach((_, gIdx) => {
          const inGrp = overlaps[gIdx] || [];
          if (!inGrp || inGrp.length === 0) {
            rowHtml += '<td style="color:#cbd5e1">-</td>';
          } else if (inGrp.length === 1) {
            rowHtml += '<td><span class="subject-pill">' + inGrp[0] + '</span></td>';
          } else {
            rowHtml += '<td><span class="subject-pill conflict">' + inGrp.join(', ') + ' (중복)</span></td>';
          }
        });

        if (hasConflict) {
          rowHtml += '<td><span class="badge badge-red">중복</span></td>';
        } else {
          rowHtml += '<td><span class="badge badge-green">정상</span></td>';
        }

        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
      });

      const resBadge = document.getElementById('resultCountBadge');
      if (resBadge) {
        resBadge.textContent = '조회 결과: ' + matchCount + '명 / 총 ' + DATA.students.length + '명';
      }
    }

    function highlightText(text, q) {
      if (!q || !text) return text || '';
      const regex = new RegExp('(' + q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + ')', 'gi');
      return text.replace(regex, '<span class="highlight">$1</span>');
    }

    function resetFilters() {
      const nf = document.getElementById('nameFilter');
      const cf = document.getElementById('careerFilter');
      const cc = document.getElementById('chkConflictOnly');
      if (nf) nf.value = '';
      if (cf) cf.value = '';
      if (cc) cc.checked = false;
      selectClass('all');
    }

    initClassPills();
    renderTable();
    applyFilters();
  ${'<' + '/script>'}
</body>
</html>`;
    }
    window.exportHtmlViewer = async function() {
      const currentSem = AppState.currentSemester || 1;
      let plan = AppState.currentPlan;
      if (!plan || !plan.groups || plan.groups.length === 0) {
        plan = getActivePlanForSemester(currentSem);
      }
      if (!plan || !plan.groups || plan.groups.length === 0) {
        alert('다운로드할 현재 시간표 배치 데이터가 없습니다. 먼저 2단계에서 과목 그룹 배치를 진행해 주세요.');
        return;
      }

      let plan1 = getActivePlanForSemester(1);
      let plan2 = getActivePlanForSemester(2);
      if (currentSem === 1) plan1 = plan;
      if (currentSem === 2) plan2 = plan;

      const { groupCounts: gc1, studentGroupOverlaps: so1 } = plan1 ? analyzeGroupConflicts(plan1) : { groupCounts: [], studentGroupOverlaps: {} };
      const { groupCounts: gc2, studentGroupOverlaps: so2 } = plan2 ? analyzeGroupConflicts(plan2) : { groupCounts: [], studentGroupOverlaps: {} };

      const acadYearStr = MultiState?.activeAcademicYear || '2027학년도';
      const gradeStr = AppState.detectedGrade || MultiState?.activeGrade || '3학년';

      const data = {
        schoolName: '상지대관령고등학교',
        acadYear: acadYearStr,
        grade: gradeStr,
        currentSemester: currentSem,
        students: AppState.students.map(st => ({
          id: st.id,
          classNum: st.classNum,
          studentNum: st.studentNum,
          name: st.name,
          career: st.career || ''
        })),
        plans: {
          1: (plan1 && plan1.groups && plan1.groups.length > 0) ? {
            semester: 1,
            groups: plan1.groups,
            conflictCount: plan1.conflictCount || 0,
            overlaps: so1,
            groupCounts: gc1
          } : null,
          2: (plan2 && plan2.groups && plan2.groups.length > 0) ? {
            semester: 2,
            groups: plan2.groups,
            conflictCount: plan2.conflictCount || 0,
            overlaps: so2,
            groupCounts: gc2
          } : null
        }
      };

      const htmlContent = generateHtmlViewerContent(data);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const fileName = `[상지대관령고등학교] ${acadYearStr}_${gradeStr}_${currentSem}학기_학생별_이동수업_시간표_조회_뷰어.html`;

      const saveRes = await window.saveFileToDirectoryOrDownload(blob, fileName, 'text/html;charset=utf-8', '시간표 웹 뷰어');
      if (saveRes && saveRes.cancelled) return;

      let locMsg = '브라우저 기본 다운로드 폴더';
      if (saveRes && saveRes.method === 'directory') locMsg = `지정된 [${saveRes.dirName}] 폴더`;
      else if (saveRes && saveRes.method === 'picker') locMsg = '선택하신 저장 폴더';

      alert(`🌐 [학생별 이동수업 시간표 웹 뷰어 저장 완료!]\n\n저장 위치: ${locMsg}\n파일명: ${fileName}\n\n※ 더블 클릭하시면 크롬·엣지 등 모든 브라우저에서 바로 열리며, 학생 이름 검색 및 반 필터 기능이 제공됩니다.`);
    };

    // ==========================================
    // GOOGLE APPS SCRIPT (GAS) INTEGRATION
    // ==========================================
    const isGasEnv = typeof google !== 'undefined' && google.script && google.script.run;

    if (isGasEnv) {
      document.getElementById('btnGasLoadSheet')?.classList.remove('hidden');
      document.getElementById('btnGasSaveToSheets')?.classList.remove('hidden');
      document.getElementById('gasQuickBanner')?.classList.remove('hidden');
    }

    document.getElementById('btnGasQuickLoad')?.addEventListener('click', triggerGasFetch);
    document.getElementById('btnGasLoadSheet')?.addEventListener('click', triggerGasFetch);

    function triggerGasFetch() {
      if (!isGasEnv) {
        alert('구글 앱스 스크립트 웹앱 환경에서만 구글 시트 직접 연동이 지원됩니다.\n(일반 브라우저에서는 엑셀 업로드를 이용해주세요)');
        return;
      }
      showLoading('구글 스프레드시트에서 데이터를 가져오는 중...');
      google.script.run
        .withSuccessHandler(res => {
          hideLoading();
          if (!res || !res.success) {
            alert(res ? res.message : '데이터를 가져오지 못했습니다.');
            return;
          }
          processGasSpreadsheetData(res);
        })
        .withFailureHandler(err => {
          hideLoading();
          alert('구글 시트 연동 오류: ' + err);
        })
        .getSpreadsheetData();
    }

    function processGasSpreadsheetData(res) {
      if (res.restoredState) {
        Object.assign(AppState, res.restoredState);
        restoredBadge.classList.remove('hidden');
        gradeBadge.textContent = `🎯 ${AppState.detectedGrade} 감지됨`;
        gradeBadge.classList.remove('hidden');
        btnResetAll.classList.remove('hidden');
        appBody.classList.remove('hidden');
        alert(`🎉 구글 시트에 저장되어 있던 [${AppState.detectedGrade}] 그룹핑 작업 상태를 복원했습니다!`);
        renderStep1();
        renderStep2UI();
        return;
      }

      // Convert 2D arrays to SheetJS workbook format in-memory
      const wb = XLSX.utils.book_new();
      res.sheets.forEach(s => {
        const ws = XLSX.utils.aoa_to_sheet(s.rows);
        XLSX.utils.book_append_sheet(wb, ws, s.name);
      });

      parseWorkbook(wb, res.fileName || 'Google_Spreadsheet');
    }

    document.getElementById('btnGasSaveToSheets')?.addEventListener('click', () => {
      if (!isGasEnv) {
        alert('구글 앱스 스크립트 웹앱 환경에서 지원되는 기능입니다.');
        return;
      }
      if (AppState.savedPlans.length === 0 && !AppState.currentPlan) {
        alert('저장할 그룹핑 안이 없습니다.');
        return;
      }

      if (AppState.savedPlans.length === 0 && AppState.currentPlan) {
        const sem = AppState.currentPlan.semester;
        AppState.savedPlans.push({
          id: Date.now(),
          name: `${sem}학기 1안 (충돌 ${AppState.currentPlan.conflictCount}명)`,
          semester: sem,
          groupCount: AppState.currentPlan.groups.length,
          groups: JSON.parse(JSON.stringify(AppState.currentPlan.groups)),
          conflictCount: AppState.currentPlan.conflictCount,
          conflicts: JSON.parse(JSON.stringify(AppState.currentPlan.conflicts)),
          customAssignments: JSON.parse(JSON.stringify(AppState.currentPlan.customAssignments || {})),
          memo: AppState.currentPlan.memo || '',
          splitConfig: JSON.parse(JSON.stringify(AppState.splitSubjects[sem] || {})),
          pinnedConfig: JSON.parse(JSON.stringify(AppState.pinnedSubjects[sem] || {})),
          timestamp: new Date().toLocaleTimeString()
        });
        renderSavedPlansList();
      }

      showLoading('구글 스프레드시트에 새 탭을 생성하고 시간표를 저장하는 중...');

      const payload = {
        savedPlans: AppState.savedPlans,
        students: AppState.students,
        stateData: {
          detectedGrade: AppState.detectedGrade,
          students: AppState.students,
          sem1Subjects: AppState.sem1Subjects,
          sem2Subjects: AppState.sem2Subjects,
          sem1GroupCount: AppState.sem1GroupCount,
          sem2GroupCount: AppState.sem2GroupCount,
          splitSubjects: AppState.splitSubjects,
          pinnedSubjects: AppState.pinnedSubjects,
          studentPins: AppState.studentPins,
          savedPlans: AppState.savedPlans
        }
      };

      google.script.run
        .withSuccessHandler(res => {
          hideLoading();
          if (res && res.success) {
            alert('🎉 구글 스프레드시트에 저장 완료!\n' + res.message);
          } else {
            alert('저장 실패: ' + (res ? res.message : '알 수 없는 오류'));
          }
        })
        .withFailureHandler(err => {
          hideLoading();
          alert('구글 시트 저장 오류: ' + err);
        })
        .saveGroupingResultsToSheets(payload);
    });

    // =========================================================================
    // MULTI-YEAR, MULTI-GRADE & CLOUD DATABASE PERSISTENCE ENGINE
    // =========================================================================

    // (Core State definitions moved to 01_core_state.js for safe hoist and global initialization)

    function syncCurrentToMulti() {
      const acadData = getAcadData();
      const y = MultiState.activeYear;
      const g = MultiState.activeGrade;
      if (!acadData[y]) acadData[y] = {};
      if (g === '전체') return; // '전체' 탭은 독자적 커리큘럼 데이터 구조를 유지하므로 AppState 덮어쓰기 방지
      
      // 현재 textarea 메모가 있다면 AppState에 즉시 동기화
      const curMemoEl = document.getElementById('step2ContextMemo');
      if (curMemoEl) {
        const curSem = AppState.currentSemester || 1;
        if (!AppState.step2Memos) AppState.step2Memos = { 1: '', 2: '' };
        AppState.step2Memos[curSem] = curMemoEl.value;
      }

      // 현재 플랜을 currentPlans에도 확실하게 동기화
      if (!AppState.currentPlans) AppState.currentPlans = { 1: null, 2: null };
      if (AppState.currentPlan && AppState.currentPlan.semester) {
        AppState.currentPlans[AppState.currentPlan.semester] = JSON.parse(JSON.stringify(AppState.currentPlan));
      }

      acadData[y][g] = {
        detectedGrade: AppState.detectedGrade || g,
        fileName: AppState.fileName || '',
        students: JSON.parse(JSON.stringify(AppState.students || [])),
        sem1Subjects: [...(AppState.sem1Subjects || [])],
        sem2Subjects: [...(AppState.sem2Subjects || [])],
        currentSemester: AppState.currentSemester || 1,
        step1Threshold: AppState.step1Threshold || 3,
        sem1GroupCount: AppState.sem1GroupCount || 5,
        sem2GroupCount: AppState.sem2GroupCount || 7,
        splitSubjects: JSON.parse(JSON.stringify(AppState.splitSubjects || { 1: {}, 2: {} })),
        pinnedSubjects: JSON.parse(JSON.stringify(AppState.pinnedSubjects || { 1: {}, 2: {} })),
        lockedGroups: JSON.parse(JSON.stringify(AppState.lockedGroups || { 1: {}, 2: {} })),
        togetherPairs: JSON.parse(JSON.stringify(AppState.togetherPairs || { 1: [], 2: [] })),
        separatePairs: JSON.parse(JSON.stringify(AppState.separatePairs || { 1: [], 2: [] })),
        closedSubjects: JSON.parse(JSON.stringify(AppState.closedSubjects || { 1: [], 2: [] })),
        _closedImportedFromPrev: Boolean(AppState._closedImportedFromPrev),
        subjectMemos: JSON.parse(JSON.stringify(AppState.subjectMemos || { 1: {}, 2: {} })),
        studentPins: JSON.parse(JSON.stringify(AppState.studentPins || [])),
        currentPlan: AppState.currentPlan ? JSON.parse(JSON.stringify(AppState.currentPlan)) : null,
        currentPlans: JSON.parse(JSON.stringify(AppState.currentPlans || { 1: null, 2: null })), 
        crossSemesterRules: JSON.parse(JSON.stringify(AppState.crossSemesterRules || [])),
        step2Memos: JSON.parse(JSON.stringify(AppState.step2Memos || { 1: '', 2: '' })),
        priorData: AppState.priorData ? JSON.parse(JSON.stringify(AppState.priorData)) : null,
        crossCheckResult: AppState.crossCheckResult ? JSON.parse(JSON.stringify(AppState.crossCheckResult)) : null,
        savedPlans: JSON.parse(JSON.stringify(AppState.savedPlans || [])),
        targetConflictN: JSON.parse(JSON.stringify(AppState.targetConflictN || { 1: null, 2: null })),
        simulationHistory: JSON.parse(JSON.stringify(AppState.simulationHistory || { 1: { runCount: 0, minConflictEver: null, minConflictPlan: null }, 2: { runCount: 0, minConflictEver: null, minConflictPlan: null } })),
        lastUpdated: new Date().toISOString()
      };
    }

    function saveAllState() {
      try {
        if (MultiState.activeGrade !== '전체') {
          syncCurrentToMulti();
        }
        const curAY = MultiState.activeAcademicYear || '2027학년도';
        if (!MultiState.datesByAcademicYear) MultiState.datesByAcademicYear = {};
        MultiState.datesByAcademicYear[curAY] = [...MultiState.yearsList];

        MultiState.lastUpdated = new Date().toISOString();
        // 메모리 상에서만 안전하게 상태를 유지 (웹상/브라우저 영구 보관 배제, 사용자가 JSON 파일로 내보내기/불러오기 전담)
        renderYearGradeNav();
        updateModalStats();
      } catch (e) {
        console.error('saveAllState error:', e);
      }
    }

    function switchAcademicContext(targetYear, targetGrade, shouldSave = true) {
      if (shouldSave && MultiState.activeGrade !== '전체') {
        syncCurrentToMulti();
      }

      if (MultiState.activeGrade === '2학년' || MultiState.activeGrade === '3학년') {
        MultiState._lastActiveGrade = MultiState.activeGrade;
      }
      if (MultiState.activeStep === 1 || MultiState.activeStep === 2) {
        MultiState._lastStep1Or2 = MultiState.activeStep;
      }

      // 탭 이동 시 과거 흔적(각 탭의 과거 학기)으로 되돌아가지 않고, 현재 눌려 있는 학기/단계를 유지 ("눌려진 대로만 이동")
      const preservedSemester = AppState.currentSemester || 1;
      let preservedStep = MultiState.activeStep || 1;
      if (targetGrade === '전체' && preservedStep === 3) {
        preservedStep = MultiState._lastStep1Or2 || 1;
        MultiState.activeStep = preservedStep;
      }

      MultiState.activeYear = targetYear;
      MultiState.activeGrade = targetGrade;
      if (targetGrade === '2학년' || targetGrade === '3학년') {
        MultiState._lastActiveGrade = targetGrade;
      }

      if (!MultiState.yearsList.includes(targetYear)) {
        MultiState.yearsList.push(targetYear);
      }

      // 탭 전환 즉시 탭 활성화 색상 및 학기/단계 비활성화 해제(unfreeze) 즉각 반영
      renderYearGradeNav();

      const acadData = getAcadData();
      if (!acadData[targetYear]) {
        acadData[targetYear] = {};
      }
      if (!acadData[targetYear]['2학년']) {
        acadData[targetYear]['2학년'] = createEmptyGradeState('2학년');
      }
      if (!acadData[targetYear]['3학년']) {
        acadData[targetYear]['3학년'] = createEmptyGradeState('3학년');
      }
      if (!acadData[targetYear]['전체']) {
        acadData[targetYear]['전체'] = {
          curriculum: [],
          lastUpdated: null
        };
      }

      const uploadSection = document.getElementById('uploadSection');
      const appBody = document.getElementById('appBody');
      const allGradesSection = document.getElementById('allGradesSection');
      const allGradesYearBadge = document.getElementById('allGradesAcademicYearBadge');
      const currentWorkText = document.getElementById('currentWorkText');

      // '전체' 탭 선택 시
      if (targetGrade === '전체') {
        if (uploadSection) uploadSection.classList.add('hidden');
        if (appBody) appBody.classList.add('hidden');
        if (btnResetAll) btnResetAll.classList.add('hidden');
        if (allGradesSection) allGradesSection.classList.remove('hidden');
        if (allGradesYearBadge) { allGradesYearBadge.textContent = ""; allGradesYearBadge.classList.add("hidden"); }

        if (currentWorkText) {
          currentWorkText.textContent = `${targetYear}학년도 전체 (전학년 교육과정 및 교사 시수)`;
        }
        if (gradeBadge) {
          gradeBadge.textContent = `📊 전체 (전학년 교사 시수 종합)`;
          gradeBadge.classList.remove('hidden');
        }

        renderYearGradeNav();
        updateModalStats();
        const curr = getAllGradesCurriculum();
        if (curr.length > 0) {
          applyStep2ToCurriculum(true, true);
        } else {
          renderAllGradesDashboard();
        }
        return;
      }

      // 2학년 또는 3학년 개별 학년 선택 시
      if (allGradesSection) allGradesSection.classList.add('hidden');
      if (uploadSection) uploadSection.classList.remove('hidden');

      const curAcadData = getAcadData();
      if (!curAcadData[targetYear][targetGrade]) {
        curAcadData[targetYear][targetGrade] = createEmptyGradeState(targetGrade);
      }

      const targetData = curAcadData[targetYear][targetGrade] || {};
      
      // 1. targetData를 기본 빈 상태와 병합하여 모든 키가 완벽히 존재하도록 함
      const cleanBase = createEmptyGradeState(targetGrade);
      const mergedData = Object.assign(cleanBase, JSON.parse(JSON.stringify(targetData)));

      // 동일 학년도 내 다른 기준 날짜에 해당 학년(targetGrade)의 사전데이터가 등록되어 있다면 자동 상속/공유
      const currAY = MultiState.activeAcademicYear || '2027학년도';
      const dateList = (MultiState.datesByAcademicYear && MultiState.datesByAcademicYear[currAY]) || MultiState.yearsList || [];
      if ((!mergedData.priorData || !mergedData.priorData.students || mergedData.priorData.students.length === 0) && !curAcadData[targetYear][targetGrade]?._cleared) {
        for (const otherDate of dateList) {
          if (curAcadData[otherDate]?.[targetGrade]?.priorData?.students?.length > 0) {
            mergedData.priorData = JSON.parse(JSON.stringify(curAcadData[otherDate][targetGrade].priorData));
            curAcadData[targetYear][targetGrade].priorData = JSON.parse(JSON.stringify(mergedData.priorData));
            break;
          }
        }
      }

      // 만약 해당 기준 날짜 탭에 아직 수강신청 조사 데이터가 없다면, 동일 학년(targetGrade)의 다른 날짜 탭에서 수강신청 조사 원본을 공유/상속
      if ((!mergedData.students || mergedData.students.length === 0) && !curAcadData[targetYear][targetGrade]?._cleared && !curAcadData[targetYear][targetGrade]?._surveyCleared) {
        for (const otherDate of dateList) {
          if (otherDate !== targetYear && curAcadData[otherDate]?.[targetGrade]?.students?.length > 0) {
            const src = curAcadData[otherDate][targetGrade];
            mergedData.students = JSON.parse(JSON.stringify(src.students || []));
            mergedData.sem1Subjects = [...(src.sem1Subjects || [])];
            mergedData.sem2Subjects = [...(src.sem2Subjects || [])];
            mergedData.fileName = src.fileName || '';
            mergedData.sem1GroupCount = src.sem1GroupCount || 5;
            mergedData.sem2GroupCount = src.sem2GroupCount || 7;
            curAcadData[targetYear][targetGrade].students = JSON.parse(JSON.stringify(mergedData.students));
            curAcadData[targetYear][targetGrade].sem1Subjects = [...mergedData.sem1Subjects];
            curAcadData[targetYear][targetGrade].sem2Subjects = [...mergedData.sem2Subjects];
            curAcadData[targetYear][targetGrade].fileName = mergedData.fileName;
            break;
          }
        }
      }

      // 이전 기준 날짜 1단계에서 폐강된 과목을 현재 기준 날짜 1단계로 1회성 복사 (폐강 확정 체크된 상태, 이후 연결되지 않음)
      if (!mergedData._closedImportedFromPrev && !curAcadData[targetYear][targetGrade]?._cleared) {
        const importedClosed = importPrevDateClosedSubjectsOnce(mergedData, targetYear, targetGrade);
        if (importedClosed) {
          curAcadData[targetYear][targetGrade].sem1Subjects = [...mergedData.sem1Subjects];
          curAcadData[targetYear][targetGrade].sem2Subjects = [...mergedData.sem2Subjects];
          curAcadData[targetYear][targetGrade].closedSubjects = JSON.parse(JSON.stringify(mergedData.closedSubjects));
          curAcadData[targetYear][targetGrade]._closedImportedFromPrev = true;
        }
      }

      // 2. AppState의 기존 모든 속성을 완전히 삭제하여 이전 학년 데이터 오염을 100% 원천 차단!
      for (const key of Object.keys(AppState)) {
        delete AppState[key];
      }
      Object.assign(AppState, mergedData);
      AppState.detectedGrade = targetGrade;

      // 현재 화면에 눌려진 학기 및 단계를 그대로 유지 (과거 탭 흔적 기억 방지)
      AppState.currentSemester = preservedSemester;
      MultiState.activeStep = preservedStep;

      if (!AppState.currentPlans) AppState.currentPlans = { 1: null, 2: null };
      if (!AppState.crossSemesterRules) AppState.crossSemesterRules = [];

      // 3. 자가 치유(Auto-Healing): 플랜 내 과목들이 현재 학년 과목인지 철저히 검증하여 타 학년 과목 오염 정화
      [1, 2].forEach(s => {
        if (AppState.currentPlans[s] && !isPlanValidForCurrentGrade(AppState.currentPlans[s], s)) {
          console.warn('[Auto-Healing] ' + targetGrade + ' ' + s + '학기 currentPlans에 타 학년 과목 오염 감지 -> 정화');
          AppState.currentPlans[s] = null;
        }
      });

      if (AppState.currentPlan && !isPlanValidForCurrentGrade(AppState.currentPlan, AppState.currentPlan.semester)) {
        console.warn('[Auto-Healing] ' + targetGrade + ' currentPlan에 타 학년 과목 오염 감지 -> 정화');
        AppState.currentPlan = null;
      }

      // 오염된 savedPlans 정리
      if (Array.isArray(AppState.savedPlans)) {
        AppState.savedPlans = AppState.savedPlans.filter(p => isPlanValidForCurrentGrade(p, p.semester));
      }

      const curSem = AppState.currentSemester || 1;
      if (AppState.currentPlan && isPlanValidForCurrentGrade(AppState.currentPlan, AppState.currentPlan.semester)) {
        if (!AppState.currentPlans[AppState.currentPlan.semester]) {
          AppState.currentPlans[AppState.currentPlan.semester] = JSON.parse(JSON.stringify(AppState.currentPlan));
        }
      }

      if (AppState.currentPlans[curSem] && isPlanValidForCurrentGrade(AppState.currentPlans[curSem], curSem)) {
        AppState.currentPlan = AppState.currentPlans[curSem];
      } else {
        const validSaved = (AppState.savedPlans || []).filter(p => p.semester === curSem && isPlanValidForCurrentGrade(p, curSem));
        if (validSaved.length > 0) {
          AppState.currentPlan = JSON.parse(JSON.stringify(validSaved[validSaved.length - 1]));
          AppState.currentPlans[curSem] = AppState.currentPlan;
        } else {
          AppState.currentPlan = null;
        }
      }

      // Ensure togetherPairs and separatePairs are defined
      if (!AppState.togetherPairs) AppState.togetherPairs = { 1: [], 2: [] };
      if (!AppState.togetherPairs[1]) AppState.togetherPairs[1] = [];
      if (!AppState.togetherPairs[2]) AppState.togetherPairs[2] = [];
      if (!AppState.separatePairs) AppState.separatePairs = { 1: [], 2: [] };
      if (!AppState.separatePairs[1]) AppState.separatePairs[1] = [];
      if (!AppState.separatePairs[2]) AppState.separatePairs[2] = [];
      if (!AppState.lockedGroups) AppState.lockedGroups = { 1: {}, 2: {} };
      if (!AppState.lockedGroups[1]) AppState.lockedGroups[1] = {};
      if (!AppState.lockedGroups[2]) AppState.lockedGroups[2] = {};

      // Update UI Elements
      if (currentWorkText) {
        currentWorkText.textContent = `${targetYear} ${targetGrade}`;
      }

      if (gradeBadge) {
        gradeBadge.textContent = `🎯 ${targetGrade} 작업 환경`;
        gradeBadge.classList.remove('hidden');
      }

      try {
        // Update Prior Data Display
        updatePriorDataUI();

        // Update Survey / Students Display
        if (AppState.students && AppState.students.length > 0) {
          AppState.students.forEach(st => {
            if (!st.origSem1) st.origSem1 = [...(st.sem1 || [])];
            if (!st.origSem2) st.origSem2 = [...(st.sem2 || [])];
          });
          appBody.classList.remove('hidden');
          btnResetAll.classList.remove('hidden');
          if (thresholdInput) thresholdInput.value = AppState.step1Threshold || 3;

          if (!AppState.savedPlans) AppState.savedPlans = [];

          if (AppState.savedPlans && AppState.savedPlans.length > 0 && !AppState.currentPlan) {
            const semSaved = AppState.savedPlans.filter(p => p.semester === curSem);
            const chosenSaved = semSaved.length > 0 ? semSaved[semSaved.length - 1] : AppState.savedPlans[0];
            AppState.currentPlan = JSON.parse(JSON.stringify(chosenSaved));
            if (AppState.currentPlan && AppState.currentPlan.semester) {
              AppState.currentPlans[AppState.currentPlan.semester] = AppState.currentPlan;
            }
          }

          updateStep1SemesterTabs(preservedSemester);
          updateStep2SemesterTabs(preservedSemester);

          const activeStep = MultiState.activeStep || 1;
          const step3View = document.getElementById('step3View');
          if (activeStep === 1) {
            if (step1View) step1View.classList.remove('hidden');
            if (step2View) step2View.classList.add('hidden');
            if (step3View) step3View.classList.add('hidden');
            renderStep1();
          } else if (activeStep === 2) {
            if (step2View) step2View.classList.remove('hidden');
            if (step1View) step1View.classList.add('hidden');
            if (step3View) step3View.classList.add('hidden');
            renderStep2UI();
          } else if (activeStep === 3) {
            if (step3View) step3View.classList.remove('hidden');
            if (step1View) step1View.classList.add('hidden');
            if (step2View) step2View.classList.add('hidden');

            if (typeof _step3ResultFilters !== 'undefined' && _step3ResultFilters) {
              if (MultiState.activeGrade === '2학년' || MultiState.activeGrade === '3학년') {
                _step3ResultFilters.grade = MultiState.activeGrade;
              } else {
                _step3ResultFilters.grade = 'all';
              }
            }

            if (typeof runStep3Validation === 'function') {
              runStep3Validation(false);
            } else if (typeof renderStep3UI === 'function') {
              renderStep3UI();
            }
          }

          if (AppState.currentPlan && isPlanValidForCurrentGrade(AppState.currentPlan, AppState.currentPlan.semester)) {
            const analysis = analyzeGroupConflicts(AppState.currentPlan);
            AppState.currentPlan.conflictCount = analysis.conflictStudentCount;
            AppState.currentPlan.conflicts = analysis.conflictDetails;
            renderStep2Results();
          }
          renderSavedPlansList();
        } else {
          const activeStep = MultiState.activeStep || 1;
          const step3View = document.getElementById('step3View');
          if (activeStep === 3) {
            if (uploadSection) uploadSection.classList.add('hidden');
            if (appBody) appBody.classList.remove('hidden');
            if (step1View) step1View.classList.add('hidden');
            if (step2View) step2View.classList.add('hidden');
            if (step3View) step3View.classList.remove('hidden');
            if (typeof runStep3Validation === 'function') {
              runStep3Validation(false);
            } else if (typeof renderStep3UI === 'function') {
              renderStep3UI();
            }
          } else {
            if (step3View) step3View.classList.add('hidden');
            if (step1View) step1View.classList.remove('hidden');
            if (step2View) step2View.classList.add('hidden');
            appBody.classList.add('hidden');
          }
          const hasPrior = !!(AppState.priorData && AppState.priorData.students && AppState.priorData.students.length > 0);
          if (hasPrior) {
            btnResetAll.classList.remove('hidden');
          } else {
            btnResetAll.classList.add('hidden');
          }
        }
      } catch (viewErr) {
        console.error('Error rendering views in switchAcademicContext:', viewErr);
      } finally {
        renderYearGradeNav();
        updateModalStats();
        updateStep2ContextMemoUI();
      }
    }


    // =========================================================================