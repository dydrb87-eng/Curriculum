    // 5. STEP 3: 교과군 선택 조건 검증 엔진 및 UI 관리 모듈
    // =========================================================================

    const STEP3_COLOR_SCHEMES = {
      blue: { key: 'blue', label: '블루', badge: 'bg-blue-50 text-blue-700 border-blue-200', border: 'border-blue-200', dot: 'bg-blue-400', ring: 'ring-blue-300' },
      emerald: { key: 'emerald', label: '에메랄드', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-200', dot: 'bg-emerald-400', ring: 'ring-emerald-300' },
      purple: { key: 'purple', label: '퍼플', badge: 'bg-purple-50 text-purple-700 border-purple-200', border: 'border-purple-200', dot: 'bg-purple-400', ring: 'ring-purple-300' },
      amber: { key: 'amber', label: '앰버', badge: 'bg-amber-50 text-amber-800 border-amber-200', border: 'border-amber-200', dot: 'bg-amber-400', ring: 'ring-amber-300' },
      rose: { key: 'rose', label: '로즈', badge: 'bg-rose-50 text-rose-700 border-rose-200', border: 'border-rose-200', dot: 'bg-rose-400', ring: 'ring-rose-300' },
      cyan: { key: 'cyan', label: '시안', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', border: 'border-cyan-200', dot: 'bg-cyan-400', ring: 'ring-cyan-300' },
      indigo: { key: 'indigo', label: '인디고', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', border: 'border-indigo-200', dot: 'bg-indigo-400', ring: 'ring-indigo-300' },
      slate: { key: 'slate', label: '그레이', badge: 'bg-slate-50 text-slate-700 border-slate-200', border: 'border-slate-200', dot: 'bg-slate-400', ring: 'ring-slate-300' }
    };

    let _step3ActiveSubTab = 'results'; // 'results' | 'categories' | 'mappings'
    let _step3ResultFilters = {
      status: 'all', // 초기값: 전체 학생 (위반·중복 학생이 최상단에 우선 정렬됨)
      grade: '3학년', // 3단계 이수 검증은 오직 3학년만 대상!
      classNum: 'all',
      categoryId: 'all',
      search: ''
    };
    let _step3MappingFilters = {
      grade: 'all',
      categoryId: 'all',
      search: ''
    };
    let _step3SelectedSubjectIds = new Set();
    window._step3LastValidationResult = null;

    function getStep3Data(acadYear = null) {
      // 모든 학년도 및 모든 기준 날짜에서 교과군 및 이수조건 설정값을 전역 공유(sharedSubjectGroups)
      if (!MultiState.sharedSubjectGroups || typeof MultiState.sharedSubjectGroups !== 'object') {
        let initialData = null;
        if (MultiState.subjectGroupsByAcademicYear && typeof MultiState.subjectGroupsByAcademicYear === 'object') {
          for (const y of Object.keys(MultiState.subjectGroupsByAcademicYear)) {
            const candidate = MultiState.subjectGroupsByAcademicYear[y];
            if (candidate && Array.isArray(candidate.categories) && candidate.categories.length > 0) {
              initialData = candidate;
              break;
            }
          }
          if (!initialData) {
            const ay = MultiState.activeAcademicYear || '2027학년도';
            initialData = MultiState.subjectGroupsByAcademicYear[ay];
          }
        }
        if (initialData) {
          MultiState.sharedSubjectGroups = JSON.parse(JSON.stringify(initialData));
        } else {
          MultiState.sharedSubjectGroups = {
            categories: [],
            mappings: {},
            excludedSubjects: {},
            studentCategoryExceptions: {}
          };
        }
      }
      // 요구사항: 검증 제외 기본 체크 해제 보장
      if (!MultiState.sharedSubjectGroups._allExcludedCleared) {
        MultiState.sharedSubjectGroups.excludedSubjects = {};
        MultiState.sharedSubjectGroups._allExcludedCleared = true;
      }
      const data = MultiState.sharedSubjectGroups;
      if (!Array.isArray(data.categories)) data.categories = [];
      if (!data.mappings || typeof data.mappings !== 'object') data.mappings = {};
      if (!data.excludedSubjects || typeof data.excludedSubjects !== 'object') data.excludedSubjects = {};
      if (!data.studentCategoryExceptions || typeof data.studentCategoryExceptions !== 'object') data.studentCategoryExceptions = {};
      return data;
    }

    let _neisSubjectCache = new Map();
    let _neisSubjectCacheKey = '';

    function invalidateNeisSubjectCache() {
      _neisSubjectCache.clear();
      _neisSubjectCacheKey = '';
      _excludedSubjectCache.clear();
    }
    window.invalidateNeisSubjectCache = invalidateNeisSubjectCache;

    function getSubjectNeisInfo(subj, grade = null) {
      if (!subj) return null;
      const ay = MultiState?.activeAcademicYear || '2027학년도';
      const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(subj) : String(subj || '').replace(/\s+/g, '').toLowerCase();
      
      const cacheKey = `${ay}`;
      if (_neisSubjectCacheKey !== cacheKey) {
        _neisSubjectCache.clear();
        _neisSubjectCacheKey = cacheKey;
        
        // 1회성 O(1) 해시 맵 빌드: 반복 탐색 오버헤드 0초화
        const neisCurricMap = MultiState?.neisCurriculumsByAcademicYear?.[ay] || {};
        for (const g of Object.keys(neisCurricMap)) {
          const parsed = neisCurricMap[g];
          if (parsed && Array.isArray(parsed.subjects)) {
            parsed.subjects.forEach(s => {
              if (s && s.subject) {
                const sNorm = (typeof normalizeSubject === 'function') ? normalizeSubject(s.subject) : String(s.subject).replace(/\s+/g, '').toLowerCase();
                if (!_neisSubjectCache.has(sNorm)) {
                  _neisSubjectCache.set(sNorm, s);
                }
              }
            });
          }
        }
        if (AppState?.neisCurriculum && Array.isArray(AppState.neisCurriculum.subjects)) {
          AppState.neisCurriculum.subjects.forEach(s => {
            if (s && s.subject) {
              const sNorm = (typeof normalizeSubject === 'function') ? normalizeSubject(s.subject) : String(s.subject).replace(/\s+/g, '').toLowerCase();
              if (!_neisSubjectCache.has(sNorm)) {
                _neisSubjectCache.set(sNorm, s);
              }
            }
          });
        }
      }

      return _neisSubjectCache.get(norm) || null;
    }
    window.getSubjectNeisInfo = getSubjectNeisInfo;

    let _excludedSubjectCache = new Map();

    function isSubjectExcludedFromValidation(subj, grade = null) {
      if (!subj) return false;
      const sData = getStep3Data();
      const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(subj) : String(subj || '').replace(/\s+/g, '').toLowerCase();
      
      // 사용자가 수동으로 체크 또는 체크해제한 내역이 있다면 그 설정 우선
      if (sData.excludedSubjects && typeof sData.excludedSubjects[norm] === 'boolean') {
        return sData.excludedSubjects[norm];
      }

      if (_excludedSubjectCache.has(norm)) {
        return _excludedSubjectCache.get(norm);
      }

      // [요구사항] 입학생 교육과정 편성표 상의 '공통' 과목인 경우 기본 검증 제외(true)
      const neisInfo = (typeof getSubjectNeisInfo === 'function') ? getSubjectNeisInfo(subj, grade) : null;
      const isEx = !!(neisInfo && (neisInfo.subjectType === '공통' || neisInfo.isCommon));
      _excludedSubjectCache.set(norm, isEx);
      return isEx;
    }
    window.isSubjectExcludedFromValidation = isSubjectExcludedFromValidation;

    function toggleSubjectValidationExclusion(grade, subj, isExcluded) {
      const sData = getStep3Data();
      if (!sData.excludedSubjects) sData.excludedSubjects = {};
      const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(subj) : String(subj || '').replace(/\s+/g, '').toLowerCase();
      sData.excludedSubjects[norm] = Boolean(isExcluded);
      _excludedSubjectCache.clear();
      saveStep3Data(sData);
      if (typeof renderScmModal === 'function') {
        renderScmModal();
      }
    }
    window.toggleSubjectValidationExclusion = toggleSubjectValidationExclusion;

    // ==========================================
    // [3단계] 학생별 교과군 선택 과목 예외(카운트 제외) 관리
    // ==========================================
    let _currentExceptionEditingStudent = null;

    function getStudentExceptionKey(grade, classNum, studentNum, name) {
      const g = String(grade || '').replace(/[^0-9]/g, '');
      const c = String(classNum || '').replace(/[^0-9]/g, '');
      const s = String(studentNum || '').replace(/[^0-9]/g, '');
      const n = String(name || '').trim().replace(/\s+/g, '');
      return `${g}_${c}_${s}_${n}`;
    }
    window.getStudentExceptionKey = getStudentExceptionKey;

    function isStudentCategorySubjectExcluded(grade, classNum, studentNum, name, catId, subj) {
      if (!subj) return false;
      const sData = getStep3Data();
      if (!sData.studentCategoryExceptions) return false;
      const stKey = getStudentExceptionKey(grade, classNum, studentNum, name);
      const normSubj = (typeof normalizeSubject === 'function') ? normalizeSubject(subj) : String(subj || '').replace(/\s+/g, '').toLowerCase();

      // 카테고리별 예외 확인
      if (catId) {
        const catKey = `${stKey}::${catId}::${normSubj}`;
        if (sData.studentCategoryExceptions[catKey] === true) return true;
      }
      // 학생 전체 교과군 공통 예외 확인
      const anyKey = `${stKey}::*::${normSubj}`;
      if (sData.studentCategoryExceptions[anyKey] === true) return true;

      return false;
    }
    window.isStudentCategorySubjectExcluded = isStudentCategorySubjectExcluded;

    function toggleStudentCategorySubjectException(grade, classNum, studentNum, name, catId, subj, isExcluded) {
      const sData = getStep3Data();
      if (!sData.studentCategoryExceptions) sData.studentCategoryExceptions = {};
      const stKey = getStudentExceptionKey(grade, classNum, studentNum, name);
      const normSubj = (typeof normalizeSubject === 'function') ? normalizeSubject(subj) : String(subj || '').replace(/\s+/g, '').toLowerCase();
      const targetCatId = catId || '*';
      const catKey = `${stKey}::${targetCatId}::${normSubj}`;

      if (isExcluded) {
        sData.studentCategoryExceptions[catKey] = true;
      } else {
        delete sData.studentCategoryExceptions[catKey];
      }

      saveStep3Data(sData);
      // window._step3LastValidationResult = null;
      renderStudentCategoryExceptionModal(grade, classNum, studentNum, name, catId);
    }
    window.toggleStudentCategorySubjectException = toggleStudentCategorySubjectException;

    function resetCurrentStudentExceptions() {
      if (!_currentExceptionEditingStudent) return;
      const { grade, classNum, studentNum, name, catId } = _currentExceptionEditingStudent;
      const sData = getStep3Data();
      if (!sData.studentCategoryExceptions) return;

      const stKey = getStudentExceptionKey(grade, classNum, studentNum, name);
      const prefix = `${stKey}::`;
      Object.keys(sData.studentCategoryExceptions).forEach(k => {
        if (k.startsWith(prefix)) {
          delete sData.studentCategoryExceptions[k];
        }
      });

      saveStep3Data(sData);
      // window._step3LastValidationResult = null;
      renderStudentCategoryExceptionModal(grade, classNum, studentNum, name, catId);
    }
    window.resetCurrentStudentExceptions = resetCurrentStudentExceptions;

    function openStudentCategoryExceptionModal(grade, classNum, studentNum, name, focusCatId = null) {
      _currentExceptionEditingStudent = { grade, classNum, studentNum, name, catId: focusCatId };
      const modal = document.getElementById('studentCategoryExceptionModal');
      if (!modal) return;

      const badge = document.getElementById('scmExceptionStudentBadge');
      if (badge) {
        badge.textContent = `${grade} ${classNum}반 ${studentNum}번 ${name}`;
      }

      renderStudentCategoryExceptionModal(grade, classNum, studentNum, name, focusCatId);
      modal.classList.remove('hidden');
    }
    window.openStudentCategoryExceptionModal = openStudentCategoryExceptionModal;

    function closeStudentCategoryExceptionModal() {
      const modal = document.getElementById('studentCategoryExceptionModal');
      if (modal) modal.classList.add('hidden');
      _currentExceptionEditingStudent = null;
    }
    window.closeStudentCategoryExceptionModal = closeStudentCategoryExceptionModal;

    function renderStudentCategoryExceptionModal(grade, classNum, studentNum, name, focusCatId = null) {
      const body = document.getElementById('scmExceptionModalBody');
      if (!body) return;

      const sData = getStep3Data();
      const categories = sData.categories || [];
      const valResult = window._step3LastValidationResult;
      const stRes = valResult?.results?.find(r => 
        String(r.grade).includes(String(grade).replace(/[^0-9]/g, '')) &&
        String(r.classNum).replace(/[^0-9]/g, '') === String(classNum).replace(/[^0-9]/g, '') &&
        String(r.studentNum).replace(/[^0-9]/g, '') === String(studentNum).replace(/[^0-9]/g, '') &&
        (r.name || '').trim() === (name || '').trim()
      );

      if (!stRes) {
        body.innerHTML = '<div class="p-8 text-center text-slate-400">해당 학생의 검증 데이터를 찾을 수 없습니다.</div>';
        return;
      }

      // 학생의 전체 후보 과목 수집 (3학년 선택 + 2학년 기이수/수강 과목)
      const allStudentSubjs = [];
      const sem1Subjs = Array.isArray(stRes.sem1) ? stRes.sem1 : [];
      const sem2Subjs = Array.isArray(stRes.sem2) ? stRes.sem2 : [];
      sem1Subjs.forEach(s => allStudentSubjs.push({ subject: s, source: '3학년 1학기 선택', semester: 1 }));
      sem2Subjs.forEach(s => allStudentSubjs.push({ subject: s, source: '3학년 2학기 선택', semester: 2 }));

      (stRes.priorDetails || []).forEach(cd => {
        if (!cd || !cd.subject) return;
        const isSem2 = (cd.source === '학생편성현황' || Number(cd.uploadSem) === 2);
        allStudentSubjs.push({
          subject: cd.subject,
          source: isSem2 ? '2학년 2학기 수강' : '2학년 1학기 기이수',
          semester: isSem2 ? 2 : 1
        });
      });

      const catsToRender = focusCatId 
        ? categories.filter(c => c.id === focusCatId)
        : categories;
      const activeCats = catsToRender.length > 0 ? catsToRender : categories;

      if (activeCats.length === 0) {
        body.innerHTML = '<div class="p-8 text-center text-slate-400">등록된 교과군이 없습니다.</div>';
        return;
      }

      let html = '';
      activeCats.forEach(cat => {
        const cColor = STEP3_COLOR_SCHEMES[cat.color] || STEP3_COLOR_SCHEMES.blue;
        const ruleDesc = formatStep3RuleDesc(cat);

        // 이 교과군에 속한 학생의 과목들 찾기
        const matchingSubjs = allStudentSubjs.filter(cand => {
          const cId = getSubjectCategory(cand.subject, grade) || getSubjectCategory(cand.subject, null);
          return cId === cat.id;
        });

        const uniqueMatching = [];
        const seen = new Set();
        matchingSubjs.forEach(m => {
          const clean = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(m.subject) : m.subject;
          if (!seen.has(clean)) {
            seen.add(clean);
            uniqueMatching.push({ ...m, cleanSubj: clean });
          }
        });

        html += `
          <div class="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-1.5">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full ${cColor.dot}"></span>
                <span class="text-sm font-black text-slate-900">${cat.name}</span>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${cColor.badge}">${cat.ruleType === 'none' ? '조건 없음' : ruleDesc}</span>
              </div>
              <span class="text-[11px] text-slate-500 font-medium">인정 대상 과목: ${uniqueMatching.length}개</span>
            </div>
        `;

        if (uniqueMatching.length === 0) {
          html += `
            <div class="p-4 rounded-xl bg-slate-50 text-center text-slate-400 text-xs italic">
              이 교과군에 해당하는 학생의 선택/기이수 과목이 없습니다.
            </div>
          `;
        } else {
          html += '<div class="space-y-1.5">';
          uniqueMatching.forEach(item => {
            const isEx = isStudentCategorySubjectExcluded(grade, classNum, studentNum, name, cat.id, item.cleanSubj);
            html += `
              <label class="flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${isEx ? 'bg-rose-50/70 border-rose-300' : 'bg-slate-50 hover:bg-indigo-50/50 border-slate-200'}">
                <div class="flex items-center gap-2 min-w-0">
                  <input type="checkbox" 
                         ${isEx ? 'checked' : ''} 
                         onchange="window.toggleStudentCategorySubjectException('${grade}', '${classNum}', '${studentNum}', decodeURIComponent('${encodeURIComponent(name)}'), '${cat.id}', decodeURIComponent('${encodeURIComponent(item.cleanSubj)}'), this.checked);" 
                         class="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer shrink-0" />
                  <div class="min-w-0">
                    <span class="text-xs font-black ${isEx ? 'line-through text-slate-400' : 'text-slate-800'}">${item.cleanSubj}</span>
                    <span class="text-[10px] text-slate-500 ml-1.5 font-medium">(${item.source})</span>
                  </div>
                </div>
                <div class="shrink-0">
                  ${isEx 
                    ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">🚫 카운트 제외됨</span>' 
                    : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">✅ 카운트 인정</span>'}
                </div>
              </label>
            `;
          });
          html += '</div>';
        }

        html += '</div>';
      });

      body.innerHTML = html;
    }
    window.renderStudentCategoryExceptionModal = renderStudentCategoryExceptionModal;


    function saveStep3Data(data, acadYear = null) {
      // 1. 전역 공유 객체에 저장 (모든 학년도 및 모든 기준 날짜에서 100% 공유)
      MultiState.sharedSubjectGroups = data;

      // 2. 하위 호환성을 위해 모든 학년도 슬롯에도 동기화
      if (!MultiState.subjectGroupsByAcademicYear) MultiState.subjectGroupsByAcademicYear = {};
      const ayList = MultiState.academicYearsList || ['2027학년도'];
      ayList.forEach(ay => {
        MultiState.subjectGroupsByAcademicYear[ay] = data;
      });
      const curAY = MultiState.activeAcademicYear || '2027학년도';
      MultiState.subjectGroupsByAcademicYear[curAY] = data;

      saveAllState();
    }

    function createDefaultStep3Categories() {
      const now = Date.now();
      return [
        {
          id: 'cat_basic_' + now,
          name: '기초 (국·영·수)',
          color: 'blue',
          targetGrade: '전체',
          targetSemester: 'all',
          ruleType: 'max',
          minCredits: 0,
          maxCredits: 24,
          minCount: 0,
          maxCount: 6,
          exactCount: 0
        },
        {
          id: 'cat_inquiry_soc_' + (now + 1),
          name: '탐구 (사회)',
          color: 'amber',
          targetGrade: '전체',
          targetSemester: 'all',
          ruleType: 'min',
          minCredits: 4,
          maxCredits: 0,
          minCount: 1,
          maxCount: 0,
          exactCount: 0
        },
        {
          id: 'cat_inquiry_sci_' + (now + 2),
          name: '탐구 (과학)',
          color: 'emerald',
          targetGrade: '전체',
          targetSemester: 'all',
          ruleType: 'min',
          minCredits: 4,
          maxCredits: 0,
          minCount: 1,
          maxCount: 0,
          exactCount: 0
        },
        {
          id: 'cat_art_pe_' + (now + 3),
          name: '체육·예술',
          color: 'purple',
          targetGrade: '전체',
          targetSemester: 'all',
          ruleType: 'min',
          minCredits: 4,
          maxCredits: 0,
          minCount: 1,
          maxCount: 0,
          exactCount: 0
        },
        {
          id: 'cat_life_' + (now + 4),
          name: '생활·교양·기술·가정·정보·제2외국어',
          color: 'cyan',
          targetGrade: '전체',
          targetSemester: 'all',
          ruleType: 'min',
          minCredits: 4,
          maxCredits: 0,
          minCount: 1,
          maxCount: 0,
          exactCount: 0
        },
        {
          id: 'cat_history_' + (now + 5),
          name: '한국사',
          color: 'rose',
          targetGrade: '전체',
          targetSemester: 'all',
          ruleType: 'min',
          minCredits: 4,
          maxCredits: 0,
          minCount: 1,
          maxCount: 0,
          exactCount: 0
        }
      ];
    }

    function formatStep3RuleDesc(cat) {
      if (!cat) return '';
      const gStr = cat.targetGrade === '전체' ? '2·3학년 전체' : cat.targetGrade;
      const semStr = cat.targetSemester === '1' ? '1학기' : (cat.targetSemester === '2' ? '2학기' : '연간');
      let ruleStr = '';
      const minC = cat.minCredits ?? cat.minCount ?? 0;
      const maxC = cat.maxCredits ?? cat.maxCount ?? 0;
      if (cat.ruleType === 'none') ruleStr = '조건 없음';
      else if (cat.ruleType === 'min') ruleStr = `${minC}개 이상`;
      else if (cat.ruleType === 'max') ruleStr = `${maxC}개 이하`;
      else if (cat.ruleType === 'range') ruleStr = `${minC}~${maxC}개`;
      else if (cat.ruleType === 'exact') ruleStr = `${cat.exactCount ?? cat.exactCredits ?? 0}개`;
      return `[${gStr} ${semStr}] ${ruleStr}`;
    }

    // 교과목의 학점(시수) 조회 헬퍼 (편성표, NEIS, 1단계 사전데이터 연계)
    function getStep3SubjectCredit(subjectName, grade) {
      if (!subjectName) return 4;
      const normTarget = (typeof normalizeSubject === 'function') ? normalizeSubject(subjectName) : subjectName.replace(/\s+/g, '');

      // 1) 편제표 및 3단계 과목 캐시에서 조회
      const allSubjs = (typeof getAllCurriculumSubjectsForStep3 === 'function') ? getAllCurriculumSubjectsForStep3() : [];
      for (const cs of allSubjs) {
        if (!cs || !cs.subject) continue;
        const normCs = (typeof normalizeSubject === 'function') ? normalizeSubject(cs.subject) : cs.subject.replace(/\s+/g, '');
        if (normCs === normTarget) {
          const cr = Number(cs.hours || cs.credit);
          if (cr > 0) return cr;
        }
      }

      // 2) NEIS 편성표에서 시수/학점 조회
      const acadYear = MultiState?.activeAcademicYear || '2027학년도';
      const neisCurricMap = MultiState?.neisCurriculumsByAcademicYear?.[acadYear] || {};
      const neisEntries = Object.values(neisCurricMap);
      if (AppState?.neisCurriculum) neisEntries.push(AppState.neisCurriculum);

      for (const parsed of neisEntries) {
        if (!parsed || !Array.isArray(parsed.subjects)) continue;
        for (const s of parsed.subjects) {
          if (!s || !s.subject) continue;
          const normS = (typeof normalizeSubject === 'function') ? normalizeSubject(s.subject) : s.subject.replace(/\s+/g, '');
          if (normS === normTarget) {
            const cr = Number(s.hours || s.credit);
            if (cr > 0) return cr;
          }
        }
      }

      // 3) 사전 데이터(이수현황)에서 단위수/학점 조회
      for (const g of ['2학년', '3학년', '1학년']) {
        const priorData = (typeof getPriorDataForGrade === 'function') ? getPriorDataForGrade(g) : null;
        if (priorData?.courseDetails) {
          for (const cd of priorData.courseDetails) {
            const normCd = (typeof normalizeSubject === 'function') ? normalizeSubject(cd.subject) : cd.subject.replace(/\s+/g, '');
            if (normCd === normTarget) {
              const cr = Number(cd.credit);
              if (cr > 0) return cr;
            }
          }
        }
      }

      return 4; // 기본 4학점 (고교 선택과목 표준)
    }
    window.getStep3SubjectCredit = getStep3SubjectCredit;

    // 사전 데이터 학생 매칭 유연화 헬퍼 (반/번호가 변경되어도 성명으로 정확히 매칭 및 동명이인 감지)
    function findMatchingPriorStudent(priorStudents, cNum, sNum, sName) {
      if (!Array.isArray(priorStudents) || priorStudents.length === 0 || !sName) return null;
      const cleanSName = sName.trim();

      // 사전 데이터 내 동일 성명 학생 수 확인 (동명이인 판별)
      const nameMatches = priorStudents.filter(p => (p.name || '').trim() === cleanSName);
      const isDuplicateName = nameMatches.length > 1;

      // 1순위: 반 + 번호 + 성명 모두 일치
      let match = priorStudents.find(p => {
        const pcMatch = (parseInt(String(p.classNum || '').replace(/[^0-9]/g, ''), 10) || 0) === (parseInt(cNum, 10) || 0);
        const pnMatch = (parseInt(String(p.studentNum || '').replace(/[^0-9]/g, ''), 10) || 0) === (parseInt(sNum, 10) || 0);
        return pcMatch && pnMatch && (p.name || '').trim() === cleanSName;
      });
      if (match) {
        return { ...match, isDuplicateName: isDuplicateName && nameMatches.length > 1 && !match };
      }

      // 2순위: 반 + 성명 일치 (번호 오기재 대비)
      match = priorStudents.find(p => {
        const pcMatch = (parseInt(String(p.classNum || '').replace(/[^0-9]/g, ''), 10) || 0) === (parseInt(cNum, 10) || 0);
        return pcMatch && (p.name || '').trim() === cleanSName;
      });
      if (match) {
        return { ...match, isDuplicateName: false };
      }

      // 3순위: 성명 일치
      if (nameMatches.length === 1) {
        // 전교(해당 학년)에 해당 이름이 오직 1명뿐인 경우: 반/번호가 바뀌어도 100% 안전하게 자동 매칭!
        return { ...nameMatches[0], isDuplicateName: false };
      } else if (nameMatches.length > 1) {
        // ⚠️ 동명이인이 2명 이상인 경우: 번호 일치자 우선 대조하되 동명이인 안내 플래그 부여
        const numMatch = nameMatches.find(p => String(p.studentNum || '').replace(/[^0-9]/g, '') === sNum);
        const selected = numMatch || nameMatches[0];
        return { ...selected, isDuplicateName: true, duplicateCandidates: nameMatches };
      }

      return null;
    }
    window.findMatchingPriorStudent = findMatchingPriorStudent;

    function getSubjectCategory(subject, grade) {
      if (!subject) return null;
      const sData = getStep3Data();
      const mappings = sData.mappings || {};
      const rawSubjStr = String(subject).trim();
      const cleanSubj = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(rawSubjStr) : rawSubjStr.replace(/[\(\[].*?[\)\]]/g, '').trim();

      // 1. 요청된 학년 접두어 포함 정확 일치 (예: '2학년::문학', '3학년::문학', '1·2학년::국어')
      if (grade) {
        if (mappings[`${grade}::${cleanSubj}`]) return mappings[`${grade}::${cleanSubj}`];
        if (mappings[`${grade}::${rawSubjStr}`]) return mappings[`${grade}::${rawSubjStr}`];
      }

      // 2. 다른 학년 접두어에 매핑되어 있는 경우라도 동일 과목명이면 교과군 인식
      for (const k in mappings) {
        if (k.includes('::')) {
          const parts = k.split('::');
          if (parts[1] === cleanSubj || parts[1] === rawSubjStr) {
            return mappings[k];
          }
        }
      }

      // 3. 기본 과목명 직접 일치 (예: '문학', '국어', '한국사', '통합과학')
      if (mappings[cleanSubj]) return mappings[cleanSubj];
      if (mappings[rawSubjStr]) return mappings[rawSubjStr];

      // 4. 정규화 키 비교 (띄어쓰기, 로마숫자, 특수문자 무시)
      const normClean = (typeof normalizeSubject === 'function') ? normalizeSubject(cleanSubj) : cleanSubj.replace(/\s+/g, '');
      for (const k in mappings) {
        const targetSubj = k.includes('::') ? k.split('::')[1] : k;
        const targetNorm = (typeof normalizeSubject === 'function') ? normalizeSubject(targetSubj) : targetSubj.replace(/\s+/g, '');
        if (targetNorm === normClean) {
          return mappings[k];
        }
      }

      // 5. [신규] 숫자 및 로마자 접미사 정규화 매칭 (예: '통합과학1' -> '통합과학', '화학I' -> '화학')
      const baseClean = cleanSubj.replace(/[\s\dⅠⅡⅢⅣⅤI|V|X]+$/g, '').trim();
      if (baseClean && baseClean !== cleanSubj) {
        if (grade && mappings[`${grade}::${baseClean}`]) return mappings[`${grade}::${baseClean}`];
        if (mappings[baseClean]) return mappings[baseClean];

        const baseNorm = (typeof normalizeSubject === 'function') ? normalizeSubject(baseClean) : baseClean.replace(/\s+/g, '');
        for (const k in mappings) {
          const targetSubj = k.includes('::') ? k.split('::')[1] : k;
          const targetBase = targetSubj.replace(/[\s\dⅠⅡⅢⅣⅤI|V|X]+$/g, '').trim();
          const targetBaseNorm = (typeof normalizeSubject === 'function') ? normalizeSubject(targetBase) : targetBase.replace(/\s+/g, '');
          if (targetBaseNorm === baseNorm) {
            return mappings[k];
          }
        }
      }

      // 6. [신규] 교육과정 편제표(NEIS) 교과(군) 정보 탐색 ('통합과학1'의 편제표 교과: '과학' 탐색)
      const categories = sData.categories || [];
      const neisInfo = (typeof getSubjectNeisInfo === 'function') 
        ? (getSubjectNeisInfo(cleanSubj, grade) || getSubjectNeisInfo(baseClean, grade)) 
        : null;
      if (neisInfo && neisInfo.category) {
        const neisCatName = String(neisInfo.category).trim();
        const matchedCat = categories.find(c => {
          const cName = String(c.name || '').trim();
          return cName === neisCatName || cName.replace(/\s+/g, '') === `${neisCatName}교과군` || cName.includes(neisCatName);
        });
        if (matchedCat) return matchedCat.id;
      }

      // 7. [신규] 고등학교 국가 교육과정 기본 교과군 휴리스틱 자동 매칭
      const standardCategoryNames = [
        { key: '과학', regex: /통합과학|과학탐구|물리학|화학|생명과학|지구과학|과학/ },
        { key: '사회', regex: /통합사회|한국사|한국지리|세계지리|세계사|동아시아사|경제|정치와법|사회문화|생활과윤리|윤리와사상|사회/ },
        { key: '국어', regex: /공통국어|국어|화법과작문|독서|언어와매체|문학/ },
        { key: '수학', regex: /공통수학|수학|미적분|확률과통계|기하/ },
        { key: '영어', regex: /공통영어|영어|영어회화|영어독해/ },
        { key: '체육', regex: /체육|운동과건강|스포츠/ },
        { key: '예술', regex: /음악|미술|연극/ },
        { key: '기술·가정', regex: /기술가정|기술·가정|정보|인공지능/ },
        { key: '제2외국어', regex: /한문|중국어|일본어|독일어|프랑스어/ },
      ];
      for (const sc of standardCategoryNames) {
        if (sc.regex.test(cleanSubj) || (baseClean && sc.regex.test(baseClean))) {
          const matchedCat = categories.find(c => {
            const cName = String(c.name || '').trim();
            return cName === sc.key || cName.includes(sc.key) || sc.key.includes(cName);
          });
          if (matchedCat) return matchedCat.id;
        }
      }

      return null;
    }

    function getStep3StudentsData() {
      if (MultiState.activeGrade !== '전체' && typeof syncCurrentToMulti === 'function') {
        syncCurrentToMulti();
      }
      const acadData = (typeof getAcadData === 'function') ? getAcadData() : {};
      const y = MultiState?.activeYear;
      const currAY = MultiState?.activeAcademicYear || '2027학년도';
      const dateList = (MultiState?.datesByAcademicYear && MultiState.datesByAcademicYear[currAY]) || MultiState?.yearsList || [];

      // 2학년 학생 데이터 (현재 탭 우선, 다른 날짜 탭 상속)
      let g2List = [];
      if (MultiState.activeGrade === '2학년' && AppState.students && Array.isArray(AppState.students)) {
        g2List = AppState.students;
      } else if (acadData[y]?.['2학년']?.students && acadData[y]['2학년'].students.length > 0) {
        g2List = acadData[y]['2학년'].students;
      } else if (!acadData[y]?.['2학년']?._cleared) {
        for (const otherDate of dateList) {
          if (acadData[otherDate]?.['2학년']?.students?.length > 0) {
            g2List = acadData[otherDate]['2학년'].students;
            break;
          }
        }
      }

      // 3학년 학생 데이터 (현재 탭 우선, 다른 날짜 탭 상속)
      let g3List = [];
      if (MultiState.activeGrade === '3학년' && AppState.students && Array.isArray(AppState.students)) {
        g3List = AppState.students;
      } else if (acadData[y]?.['3학년']?.students && acadData[y]['3학년'].students.length > 0) {
        g3List = acadData[y]['3학년'].students;
      } else if (!acadData[y]?.['3학년']?._cleared) {
        for (const otherDate of dateList) {
          if (acadData[otherDate]?.['3학년']?.students?.length > 0) {
            g3List = acadData[otherDate]['3학년'].students;
            break;
          }
        }
      }

      const grade2Students = JSON.parse(JSON.stringify(g2List || []));
      const grade3Students = JSON.parse(JSON.stringify(g3List || []));

      // 각 학년 레이블을 엄격하게 적용
      grade2Students.forEach(st => { st.grade = '2학년'; });
      grade3Students.forEach(st => { st.grade = '3학년'; });

      return { grade2Students, grade3Students };
    }

    function getPriorDataForGrade(grade) {
      const y = MultiState?.activeYear;
      const acadData = (typeof getAcadData === 'function') ? getAcadData() : {};
      if (MultiState.activeGrade === grade && AppState.priorData && Array.isArray(AppState.priorData.students) && AppState.priorData.students.length > 0) {
        return AppState.priorData;
      }
      if (acadData[y]?.[grade]?.priorData?.students?.length > 0) {
        return acadData[y][grade].priorData;
      }
      const currAY = MultiState.activeAcademicYear || '2027학년도';
      const dateList = (MultiState.datesByAcademicYear && MultiState.datesByAcademicYear[currAY]) || MultiState.yearsList || [];
      for (const otherDate of dateList) {
        if (acadData[otherDate]?.[grade]?.priorData?.students?.length > 0) {
          return acadData[otherDate][grade].priorData;
        }
      }
      return null;
    }

    function getCrossCheckDuplicatesForGrade(grade) {
      const y = MultiState?.activeYear;
      const acadData = (typeof getAcadData === 'function') ? getAcadData() : {};
      if (MultiState.activeGrade === grade && AppState.crossCheckResult && Array.isArray(AppState.crossCheckResult.duplicateEnrollments) && AppState.crossCheckResult.duplicateEnrollments.length > 0) {
        return AppState.crossCheckResult.duplicateEnrollments;
      }
      if (acadData[y]?.[grade]?.crossCheckResult?.duplicateEnrollments?.length > 0) {
        return acadData[y][grade].crossCheckResult.duplicateEnrollments;
      }
      const currAY = MultiState.activeAcademicYear || '2027학년도';
      const dateList = (MultiState.datesByAcademicYear && MultiState.datesByAcademicYear[currAY]) || MultiState.yearsList || [];
      for (const otherDate of dateList) {
        if (acadData[otherDate]?.[grade]?.crossCheckResult?.duplicateEnrollments?.length > 0) {
          return acadData[otherDate][grade].crossCheckResult.duplicateEnrollments;
        }
      }
      return null;
    }

    function detectStudentDuplicates(st, priorData, crossCheckDuplicates, targetGradeNum) {
      if (!st) return [];
      const cNum = String(st.classNum || '').replace(/[^0-9]/g, '');
      const sNum = String(st.studentNum || '').replace(/[^0-9]/g, '');
      const sName = (st.name || '').trim();

      // 1단계와 100% 동일한 실시간 중복 탐지 로직 수행 (과목 관리 수정사항 즉시 반영 보장)
      const sGradeNum = (st.grade ? String(st.grade).replace(/[^0-9]/g, '') : '') || targetGradeNum || '3';
      const dupList = [];
      const seenNormsThisStudent = new Set();

      const sem1Norms = (st.sem1 || []).map(s => ({ raw: s, norm: (typeof normalizeSubject === 'function') ? normalizeSubject(s) : String(s).trim() })).filter(x => x.norm);
      const sem2Norms = (st.sem2 || []).map(s => ({ raw: s, norm: (typeof normalizeSubject === 'function') ? normalizeSubject(s) : String(s).trim() })).filter(x => x.norm);

      // A-1. 1학기 내 동일 과목 2회 이상 중복 선택
      const sem1CountMap = {};
      sem1Norms.forEach(({ raw, norm }) => {
        sem1CountMap[norm] = (sem1CountMap[norm] || 0) + 1;
      });
      Object.entries(sem1CountMap).forEach(([norm, count]) => {
        if (count > 1) {
          const matchedRaw = sem1Norms.find(x => x.norm === norm)?.raw || norm;
          dupList.push({
            subject: matchedRaw,
            normalized: norm,
            gradeNum: sGradeNum,
            semester: 1,
            sourceType: 'current_same_sem',
            sourceLabel: `현재 학년 1학기 내 중복(${count}회)`
          });
        }
      });

      // A-2. 2학기 내 동일 과목 2회 이상 중복 선택
      const sem2CountMap = {};
      sem2Norms.forEach(({ raw, norm }) => {
        sem2CountMap[norm] = (sem2CountMap[norm] || 0) + 1;
      });
      Object.entries(sem2CountMap).forEach(([norm, count]) => {
        if (count > 1) {
          const matchedRaw = sem2Norms.find(x => x.norm === norm)?.raw || norm;
          dupList.push({
            subject: matchedRaw,
            normalized: norm,
            gradeNum: sGradeNum,
            semester: 2,
            sourceType: 'current_same_sem',
            sourceLabel: `현재 학년 2학기 내 중복(${count}회)`
          });
        }
      });

      // A-3. 1학기 ↔ 2학기 간 동일 과목 중복 신청 (현재 학년 1·2학기 중복)
      sem1Norms.forEach(({ raw: raw1, norm: norm1 }) => {
        const inSem2 = sem2Norms.find(x => x.norm === norm1);
        if (inSem2) {
          const dupKey = `cross_sem_${norm1}`;
          if (!seenNormsThisStudent.has(dupKey)) {
            seenNormsThisStudent.add(dupKey);
            dupList.push({
              subject: raw1,
              normalized: norm1,
              gradeNum: sGradeNum,
              semester: 1,
              sourceType: 'current_cross_sem',
              sourceLabel: `현재 학년 1·2학기 중복`
            });
            dupList.push({
              subject: inSem2.raw,
              normalized: norm1,
              gradeNum: sGradeNum,
              semester: 2,
              sourceType: 'current_cross_sem',
              sourceLabel: `현재 학년 1·2학기 중복`
            });
          }
        }
      });

      // B. 이전 학년 기이수 과목과 중복 대조 (사전 등록된 NEIS 명부 - 성명 기반 유연 매칭 지원)
      if (priorData && Array.isArray(priorData.students) && priorData.students.length > 0) {
        const priorSt = (typeof findMatchingPriorStudent === 'function')
          ? findMatchingPriorStudent(priorData.students, cNum, sNum, sName)
          : priorData.students.find(p => (p.name || '').trim() === sName);

        if (priorSt) {
          const priorHas = (subj) => {
            const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(subj) : String(subj).trim();
            if (!norm) return false;
            if (Array.isArray(priorSt.subjects)) {
              return priorSt.subjects.some(ps => (typeof normalizeSubject === 'function' ? normalizeSubject(ps) : ps) === norm);
            }
            if (priorSt.subjects && typeof priorSt.subjects.has === 'function') {
              return priorSt.subjects.has(norm);
            }
            return false;
          };

          (st.sem1 || []).forEach(subj => {
            if (priorHas(subj)) {
              const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(subj) : subj;
              const dupKey = `prior_1_${norm}`;
              if (!seenNormsThisStudent.has(dupKey)) {
                seenNormsThisStudent.add(dupKey);
                dupList.push({
                  subject: subj,
                  normalized: norm,
                  gradeNum: sGradeNum,
                  semester: 1,
                  sourceType: 'prior_grade',
                  sourceLabel: `이전 학년 기이수 중복`
                });
              }
            }
          });

          (st.sem2 || []).forEach(subj => {
            if (priorHas(subj)) {
              const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(subj) : subj;
              const dupKey = `prior_2_${norm}`;
              if (!seenNormsThisStudent.has(dupKey)) {
                seenNormsThisStudent.add(dupKey);
                dupList.push({
                  subject: subj,
                  normalized: norm,
                  gradeNum: sGradeNum,
                  semester: 2,
                  sourceType: 'prior_grade',
                  sourceLabel: `이전 학년 기이수 중복`
                });
              }
            }
          });
        }
      }

      return dupList;
    }

    function getAllCurriculumSubjectsForStep3() {
      const acadYear = MultiState?.activeAcademicYear || '2027학년도';
      const curriculum = (typeof getAllGradesCurriculum === 'function') ? getAllGradesCurriculum() : [];
      const map = new Map();

      // 1) 전체 시수종합 편제표 과목 수집 (선택 + 공통/지정 과목 모두 포함)
      curriculum.forEach(item => {
        if (!item || !item.subject) return;
        if (item.id && String(item.id).startsWith('step3_supp_')) return;

        const grade = item.grade || '2학년';
        const sem = item.semester || 1;
        const subj = item.subject.trim();
        const key = `${grade}::${sem}학기::${subj}`;
        if (!map.has(key)) {
          const neisInfo = getSubjectNeisInfo(subj, grade);
          const isCommon = item.subjectType === '공통' || neisInfo?.subjectType === '공통' || neisInfo?.isCommon || (typeof isSubjectExcludedFromValidation === 'function' && isSubjectExcludedFromValidation(subj, grade));
          map.set(key, {
            ...item,
            subject: subj,
            category: item.category || (isCommon ? '학교지정' : '학생선택'),
            subjectType: item.subjectType || neisInfo?.subjectType || (isCommon ? '공통' : '일반 선택'),
            source: 'curriculum'
          });
        }
      });

      // 2) NEIS 입학생 3개년 교육과정 편성표 과목 수집 (1학년 공통과목 포함 1·2·3학년 전체 과목)
      const neisCurricMap = MultiState?.neisCurriculumsByAcademicYear?.[acadYear] || {};
      const neisEntries = Object.values(neisCurricMap);
      if (AppState?.neisCurriculum) neisEntries.push(AppState.neisCurriculum);

      neisEntries.forEach(parsed => {
        if (!parsed || !Array.isArray(parsed.subjects)) return;
        parsed.subjects.forEach(s => {
          if (!s || !s.subject) return;
          const gradeStr = s.gradeStr || `${s.grade}학년`;
          const sem = Number(s.semester) || 1;
          const subj = s.subject.trim();
          const key = `${gradeStr}::${sem}학기::${subj}`;
          if (!map.has(key)) {
            const isCommon = s.subjectType === '공통' || s.isCommon || s.grade === 1 || s.type === '학교지정' || (typeof isSubjectExcludedFromValidation === 'function' && isSubjectExcludedFromValidation(subj, gradeStr));
            map.set(key, {
              id: `neis_${s.grade}_${sem}_${subj}`,
              grade: gradeStr,
              semester: sem,
              subject: subj,
              category: s.type || (isCommon ? '학교지정' : '학생선택'),
              subjectType: s.subjectType || (isCommon ? '공통' : '일반 선택'),
              hours: s.hours || s.credit || 0,
              teacher: '미배정',
              status: '개설',
              source: 'neisCurriculum'
            });
          }
        });
      });

      // 3) 사전 데이터(생활기록부/편성현황) 등록 과목 수집
      const priorDataG2 = (typeof getPriorDataForGrade === 'function') ? getPriorDataForGrade('2학년') : null;
      const priorDataG3 = (typeof getPriorDataForGrade === 'function') ? getPriorDataForGrade('3학년') : null;
      const priorCoursesCollected = [];

      [priorDataG2, priorDataG3].forEach(pd => {
        if (!pd) return;
        if (Array.isArray(pd.courses) && pd.courses.length > 0) {
          pd.courses.forEach(c => priorCoursesCollected.push(c));
        } else if (Array.isArray(pd.students)) {
          pd.students.forEach(st => {
            if (Array.isArray(st.courseDetails) && st.courseDetails.length > 0) {
              st.courseDetails.forEach(cd => priorCoursesCollected.push({
                subject: cd.subject,
                grade: cd.grade || (st.grade === '3학년' ? '1·2학년' : '1학년'),
                semester: cd.semester || 1,
                credit: cd.credit || 0,
                organization: cd.organization || '사전데이터',
                source: '사전데이터'
              }));
            } else if (Array.isArray(st.rawSubjects)) {
              st.rawSubjects.forEach(rs => {
                const cSubj = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(rs) : rs.trim();
                if (cSubj) {
                  priorCoursesCollected.push({
                    subject: cSubj,
                    grade: st.grade === '3학년' ? '1·2학년' : '1학년',
                    semester: 1,
                    credit: 0,
                    organization: '사전데이터',
                    source: '사전데이터'
                  });
                }
              });
            }
          });
        }
      });

      priorCoursesCollected.forEach(pItem => {
        if (!pItem || !pItem.subject) return;
        const subj = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(pItem.subject) : pItem.subject.trim();
        if (!subj) return;

        const pGrade = pItem.grade || '기이수';
        const pSem = pItem.semester || 1;
        const key = `${pGrade}::${pSem}학기::${subj}`;

        const existingCurricSameSubj = Array.from(map.values()).some(item => (typeof getBaseSubjectName === 'function' ? getBaseSubjectName(item.subject) : item.subject.trim()) === subj);
        if (!map.has(key) && !existingCurricSameSubj) {
          const neisInfo = getSubjectNeisInfo(subj, pGrade);
          const isCommon = neisInfo?.subjectType === '공통' || neisInfo?.isCommon;
          map.set(key, {
            id: `prior_${pGrade}_${pSem}_${subj}`,
            grade: pGrade,
            semester: pSem,
            subject: subj,
            category: pItem.organization || (isCommon ? '학교지정' : '선택(사전)'),
            subjectType: neisInfo?.subjectType || (isCommon ? '공통' : '일반 선택'),
            hours: pItem.credit || 0,
            teacher: '기이수',
            status: '사전데이터',
            source: '사전데이터'
          });
        }
      });

      // 4) 수강신청 조사(학생 응답)에 있는 모든 과목 수집 (입학생 교육과정 외 과목도 배정 대기 과목 목록에 빠짐없이 배치)
      const { grade2Students, grade3Students } = getStep3StudentsData();
      [...grade2Students, ...grade3Students].forEach(st => {
        const sGrade = st.grade || '2학년';
        const addSubjFromSurvey = (subj, sem) => {
          if (!subj) return;
          const cleanSubj = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(subj) : subj.trim();
          if (!cleanSubj) return;
          const key = `${sGrade}::${sem}학기::${cleanSubj}`;
          const existingSameSubj = Array.from(map.values()).some(item => 
            (typeof getBaseSubjectName === 'function' ? getBaseSubjectName(item.subject) : item.subject.trim()) === cleanSubj
          );
          if (!map.has(key) && !existingSameSubj) {
            const neisInfo = getSubjectNeisInfo(cleanSubj, sGrade);
            map.set(key, {
              id: `survey_${sGrade}_${sem}_${cleanSubj}`,
              grade: sGrade,
              semester: sem,
              subject: cleanSubj,
              category: '학생선택',
              subjectType: neisInfo?.subjectType || '일반 선택',
              hours: 4,
              teacher: '미배정',
              status: '설문신청',
              source: 'survey'
            });
          }
        };
        (st.sem1 || []).forEach(s => addSubjFromSurvey(s, 1));
        (st.sem2 || []).forEach(s => addSubjFromSurvey(s, 2));
      });

      return Array.from(map.values()).sort((a, b) => {
        if (a.source !== b.source) return a.source === 'curriculum' ? -1 : (a.source === 'neisCurriculum' ? 0 : 1);
        if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
        if (a.semester !== b.semester) return a.semester - b.semester;
        return (a.subject || '').localeCompare(b.subject || '', 'ko');
      });
    }

    function getStep3ValidationSummaryQuick() {
      if (window._step3LastValidationResult && window._step3LastValidationResult.totalCount > 0) {
        const needCnt = window._step3LastValidationResult.needGuidanceCount !== undefined 
          ? window._step3LastValidationResult.needGuidanceCount 
          : window._step3LastValidationResult.violatedCount;
        return {
          total: window._step3LastValidationResult.totalCount,
          violated: needCnt,
          passed: window._step3LastValidationResult.passedCount
        };
      }
      return null;
    }

        // [신규] 입학생 교육과정 편제표에서 3학년 학교지정 과목 추출
    function getGrade3DesignatedSubjectsFromCurriculum() {
      const list = [];
      const seen = new Set();
      const ay = MultiState?.activeAcademicYear || '2027학년도';
      const neisCurricMap = MultiState?.neisCurriculumsByAcademicYear?.[ay] || {};
      const neisEntries = Object.values(neisCurricMap);
      if (AppState?.neisCurriculum) neisEntries.push(AppState.neisCurriculum);

      // 1) NEIS 입학생 교육과정 편제표
      for (const parsed of neisEntries) {
        if (!parsed || !Array.isArray(parsed.subjects)) continue;
        for (const s of parsed.subjects) {
          if (!s || !s.subject) continue;
          const gNum = parseInt(String(s.grade || s.gradeStr || '0').replace(/[^0-9]/g, ''), 10);
          const isG3 = (gNum === 3 || String(s.gradeStr || '').includes('3'));
          const isDesignated = (s.type === '학교지정' || s.gubun === '학교지정' || s.isCommon || s.subjectType === '공통' || !s.electiveGroupName);

          if (isG3 && isDesignated) {
            const cleanS = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(s.subject) : s.subject;
            const sem = Number(s.semester || 1);
            const key = `${sem}::${cleanS}`;
            if (!seen.has(key)) {
              seen.add(key);
              list.push({
                subject: cleanS,
                rawSubject: s.subject,
                credit: Number(s.hours) || 4,
                semester: sem,
                uploadSem: sem,
                grade: '3학년',
                category: s.category || '',
                domain: s.domain || '',
                type: '학교지정',
                source: '입학생교육과정'
              });
            }
          }
        }
      }

      // 2) 전체 시수종합 편제표(3학년 학교지정 과목) 보완
      const curriculumAll = (typeof getAllGradesCurriculum === 'function') ? getAllGradesCurriculum() : [];
      curriculumAll.forEach(c => {
        if (!c || !c.subject) return;
        const gNum = parseInt(String(c.grade || '0').replace(/[^0-9]/g, ''), 10);
        const isG3 = (gNum === 3 || String(c.grade || '').includes('3'));
        const isDesignated = (c.category === '지정' || c.category === '학교지정' || c.type === '학교지정' || c.isCommon);

        if (isG3 && isDesignated) {
          const cleanS = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(c.subject) : c.subject;
          const sem = Number(c.semester || 1);
          const key = `${sem}::${cleanS}`;
          if (!seen.has(key)) {
            seen.add(key);
            list.push({
              subject: cleanS,
              rawSubject: c.subject,
              credit: Number(c.hours) || 4,
              semester: sem,
              uploadSem: sem,
              grade: '3학년',
              category: c.category || '',
              type: '학교지정',
              source: '입학생교육과정'
            });
          }
        }
      });

      return list;
    }
    window.getGrade3DesignatedSubjectsFromCurriculum = getGrade3DesignatedSubjectsFromCurriculum;

    function runStep3Validation(showAlert = false) {
      const sData = getStep3Data();
      const categories = sData.categories || [];
      const g3DesignatedSubjects = getGrade3DesignatedSubjectsFromCurriculum();
      const { grade3Students } = getStep3StudentsData();
      // [요구사항 반영]: 이수 검증은 오직 '3학년' 학생만 대상!
      // 기준 데이터: 1) 교과학습발달상황(1·2학년 기이수 과목) + 2) 수강신청내역(3학년 선택과목)
      let allStudents = [...grade3Students];
      if (allStudents.length === 0 && AppState.students && Array.isArray(AppState.students) && AppState.students.length > 0) {
        if (MultiState.activeGrade === '3학년' || AppState.detectedGrade === '3학년') {
          allStudents = AppState.students.map(st => ({
            ...st,
            grade: '3학년'
          }));
        }
      }

      const priorDataG2 = getPriorDataForGrade('2학년');
      const priorDataG3 = getPriorDataForGrade('3학년');

      // 3학년 수강신청 조사(allStudents)가 비어있는 경우 3학년 교과학습발달상황(사전데이터) 학생으로 폴백
      if (allStudents.length === 0) {
        const fallbackStudents = [];
        const seenFallbackKeys = new Set();
        const registerFallback = (st, gradeLabel) => {
          if (!st || !st.name) return;
          const cNum = String(st.classNum || '').replace(/[^0-9]/g, '');
          const sNum = String(st.studentNum || '').replace(/[^0-9]/g, '');
          const sName = (st.name || '').trim();
          const key = `${gradeLabel}::${cNum}::${sNum}::${sName}`;
          if (seenFallbackKeys.has(key)) return;
          seenFallbackKeys.add(key);

          const s1 = [];
          const s2 = [];
          (st.courseDetails || []).forEach(cd => {
            if (!cd || !cd.subject) return;
            const isSem2 = (cd.source === '학생편성현황' || Number(cd.uploadSem) === 2);
            if (isSem2) s2.push(cd.subject);
            else s1.push(cd.subject);
          });

          fallbackStudents.push({
            id: `prior_${key}`,
            name: sName,
            classNum: cNum || '1',
            studentNum: sNum || '01',
            grade: gradeLabel,
            sem1: s1,
            sem2: s2,
            isFromPriorOnly: true
          });
        };

        if (priorDataG3?.students) priorDataG3.students.forEach(st => registerFallback(st, '3학년'));
        allStudents = fallbackStudents;
      }
      const crossDupsG2 = getCrossCheckDuplicatesForGrade('2학년');
      const crossDupsG3 = getCrossCheckDuplicatesForGrade('3학년');

      // 편제표상 '지정' 및 '선택' 과목 Set 구축 ('지정' 과목은 교과군 배정 및 선택조건 검토에서 원천 제외!)
      const curriculumAll = (typeof getAllGradesCurriculum === 'function') ? getAllGradesCurriculum() : [];
      const designatedSubjNormSet = new Set();
      const electiveSubjNormSet = new Set();

      curriculumAll.forEach(c => {
        if (!c || !c.subject) return;
        const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(c.subject) : String(c.subject).trim();
        if (c.category === '지정' || c.category === '학교지정') {
          if (norm) designatedSubjNormSet.add(norm);
        } else if (c.category === '선택' || c.category === '학생선택') {
          if (norm) electiveSubjNormSet.add(norm);
        }
      });

      const isDesignatedSubject = (s, candGrade = null, candSem = null, candCat = null) => {
        if (!s) return false;
        const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(s) : String(s).trim();
        // 엑셀 자체의 구분/교과구분 컬럼에 '지정/공통' 표기가 있는 경우
        if (candCat && /지정|학교지정|공통과목|공통/.test(candCat)) return true;
        // 편제표상 지정 과목 Set에 등록되어 있는 경우
        if (designatedSubjNormSet.has(norm)) return true;

        // 특정 학년/학기 편제표 조건 대조
        if (candGrade || candSem) {
          const curMatch = curriculumAll.find(c => {
            const cNorm = (typeof normalizeSubject === 'function') ? normalizeSubject(c.subject) : c.subject;
            if (cNorm !== norm) return false;
            if (candGrade && !String(c.grade || '').includes(String(candGrade).replace(/[^0-9]/g, ''))) return false;
            if (candSem && Number(c.semester) !== Number(candSem)) return false;
            return true;
          });
          if (curMatch) {
            if (curMatch.category === '지정' || curMatch.category === '학교지정') return true;
            if (curMatch.category === '선택' || curMatch.category === '학생선택') return false;
          }
        }
        return false;
      };

      const isElectiveSubject = (s, candGrade = null, candSem = null, candCat = null) => {
        if (!s) return false;
        // 사용자 설정 또는 공통과목 검증 제외 체크박스 확인
        if (typeof isSubjectExcludedFromValidation === 'function' && isSubjectExcludedFromValidation(s, candGrade)) {
          return false;
        }
        // 지정 과목이면 선택 과목이 아님
        if (isDesignatedSubject(s, candGrade, candSem, candCat)) return false;

        const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(s) : String(s).trim();
        // 엑셀 자체의 구분 컬럼에 '선택' 표기가 있는 경우
        if (candCat && /선택|일반선택|진로선택|융합선택/.test(candCat)) return true;
        // 편제표상 선택 과목 Set에 등록되어 있는 경우
        if (electiveSubjNormSet.has(norm)) return true;

        if (candGrade || candSem) {
          const curMatch = curriculumAll.find(c => {
            const cNorm = (typeof normalizeSubject === 'function') ? normalizeSubject(c.subject) : c.subject;
            if (cNorm !== norm) return false;
            if (candGrade && !String(c.grade || '').includes(String(candGrade).replace(/[^0-9]/g, ''))) return false;
            if (candSem && Number(c.semester) !== Number(candSem)) return false;
            return true;
          });
          if (curMatch && (curMatch.category === '선택' || curMatch.category === '학생선택')) return true;
        }

        // 요구사항: 검증 제외 모두 체크 없이 처리 (사용자가 직접 체크박스를 켠 경우에만 제외)
        return true;
      };

      const results = [];
      const catViolationCounts = {};
      categories.forEach(c => { catViolationCounts[c.id] = 0; });
      const unmappedSubjSet = new Set();

      allStudents.forEach(st => {
        try {
          const sGrade = st.grade || '2학년';
          const studentSem1 = Array.isArray(st.sem1) ? st.sem1 : [];
          const studentSem2 = Array.isArray(st.sem2) ? st.sem2 : [];
        const studentAllChoices = [...studentSem1, ...studentSem2];

        // 사전 데이터에서 해당 학생의 기이수 및 2학기 수강 과목 찾기 (3학년 탭과 2학년 탭, 현재 탭을 모두 대조하여 1·2학기 과목 완전 통합)
        const cNum = String(st.classNum || '').replace(/[^0-9]/g, '');
        const sNum = String(st.studentNum || '').replace(/[^0-9]/g, '');
        const sName = (st.name || '').trim();

        const matchedG3 = (priorDataG3 && Array.isArray(priorDataG3.students)) ? findMatchingPriorStudent(priorDataG3.students, cNum, sNum, sName) : null;
        const matchedG2 = (priorDataG2 && Array.isArray(priorDataG2.students)) ? findMatchingPriorStudent(priorDataG2.students, cNum, sNum, sName) : null;
        const matchedCur = (AppState.priorData && Array.isArray(AppState.priorData.students)) ? findMatchingPriorStudent(AppState.priorData.students, cNum, sNum, sName) : null;

        const combinedCourseDetails = [];
        const seenCourseKeys = new Set();

        const collectDetails = (cand) => {
          if (!cand) return;
          if (Array.isArray(cand.courseDetails) && cand.courseDetails.length > 0) {
            cand.courseDetails.forEach(cd => {
              if (!cd || !cd.subject) return;
              const cleanS = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(cd.subject) : cd.subject;
              const normS = cd.normSubject || (typeof normalizeSubject === 'function' ? normalizeSubject(cleanS) : cleanS);

              // 2학기 편성 데이터 (학생편성현황) vs 1학기/기이수 과목 (교과학습발달상황) 판별
              const isPlacementSem2 = (cd.source === '학생편성현황' || Number(cd.uploadSem) === 2);
              const cSem = Number(cd.semester || (isPlacementSem2 ? 2 : 1));

              // 사용자 설정에 의한 검증 제외 과목만 제외 (기이수 통합과학1 등은 정상 반영)
              if (typeof isSubjectExcludedFromValidation === 'function' && isSubjectExcludedFromValidation(cleanS, cd.grade)) {
                return;
              }

              const cKey = `${cSem}::${normS}`;
              if (!seenCourseKeys.has(cKey)) {
                seenCourseKeys.add(cKey);
                combinedCourseDetails.push({
                  ...cd,
                  subject: cleanS,
                  normSubject: normS,
                  semester: cSem,
                  uploadSem: cd.uploadSem || cSem,
                  grade: cd.grade || (st.grade === '3학년' ? '2학년' : '1학년'),
                  source: cd.source || (isPlacementSem2 ? '학생편성현황' : '교과학습발달상황')
                });
              }
            });
          } else if (Array.isArray(cand.rawSubjects) && cand.rawSubjects.length > 0) {
            cand.rawSubjects.forEach(rs => {
              const cleanS = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(rs) : rs;
              const normS = (typeof normalizeSubject === 'function') ? normalizeSubject(cleanS) : cleanS;
              if (typeof isSubjectExcludedFromValidation === 'function' && isSubjectExcludedFromValidation(cleanS)) return;

              const cKey = `1::${normS}`;
              if (!seenCourseKeys.has(cKey)) {
                seenCourseKeys.add(cKey);
                combinedCourseDetails.push({
                  subject: cleanS,
                  rawSubject: rs,
                  normSubject: normS,
                  credit: 4,
                  semester: 1,
                  uploadSem: 1,
                  grade: st.grade === '3학년' ? '2학년' : '1학년',
                  source: '교과학습발달상황'
                });
              }
            });
          }
        };

        if (st.grade === '3학년') {
          // [사용자 요구사항]:
          // 1. 교과학습발달상황에서 '2학년 1학기' 이수 과목 확인
          // 2. 입학생교육과정 편제표 기준 '선택'에 해당하는 과목만 확인 (공통/지정 제외)
          const targetPrior = matchedG3 || matchedCur || matchedG2;
          if (targetPrior && Array.isArray(targetPrior.courseDetails)) {
            targetPrior.courseDetails.forEach(cd => {
              if (!cd || !cd.subject) return;

              // 2학년 1학기 과목인지 판별 (1학년 과목 제외, 2학기 과목 제외)
              const gStr = String(cd.grade || '');
              const isG2 = gStr.includes('2') || (!gStr.includes('1') && !gStr.includes('3'));
              const isS1 = Number(cd.semester || 1) === 1 && cd.uploadSem !== 2 && cd.source !== '학생편성현황';
              if (!isG2 || !isS1) return;

              const cleanS = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(cd.subject) : cd.subject;
              const normS = cd.normSubject || (typeof normalizeSubject === 'function' ? normalizeSubject(cleanS) : cleanS);

              // 입학생교육과정 편제표 기준 '선택'에 해당하는 과목만 확인 ('지정', '공통' 과목 및 검증제외 과목 제외!)
              if (isDesignatedSubject(cleanS, '2학년', 1, cd.category)) return;
              if (typeof isSubjectExcludedFromValidation === 'function' && isSubjectExcludedFromValidation(cleanS, '2학년')) return;

              const cKey = `2-1::${normS}`;
              if (!seenCourseKeys.has(cKey)) {
                seenCourseKeys.add(cKey);
                combinedCourseDetails.push({
                  ...cd,
                  subject: cleanS,
                  normSubject: normS,
                  semester: 1,
                  uploadSem: 1,
                  grade: '2학년',
                  source: '교과학습발달상황(2-1선택)'
                });
              }
            });
          }
        } else {
          collectDetails(matchedG2);
          collectDetails(matchedCur);
        }

        const studentPriorCourseDetails = combinedCourseDetails;
        const studentPriorSubjs = combinedCourseDetails.map(cd => cd.subject).filter(Boolean);
        const priorSem1Details = combinedCourseDetails.filter(cd => cd.semester === 1);
        const priorSem2Details = combinedCourseDetails.filter(cd => cd.semester === 2);

        // [오직 '선택' 과목만 검토 대상]: 지정 과목은 교과군 미지정 경고 및 검토에서 제외!
        studentAllChoices.forEach(s => {
          if (isDesignatedSubject(s)) return; // 지정 과목 제외
          const cId = getSubjectCategory(s, st.grade);
          if (!cId) unmappedSubjSet.add(s);
        });
        studentPriorSubjs.forEach(s => {
          if (isDesignatedSubject(s)) return; // 지정 과목 제외
          const cId = getSubjectCategory(s, null);
          if (!cId) unmappedSubjSet.add(s);
        });

        const violations = [];
        const catEvaluations = [];

        categories.forEach(cat => {
          // [사용자 중심 탭 기준 직관적 검증 메커니즘]:
          // 탭(학년)별로 등록된 교과군 조건에 대해 학생의 [사전 데이터]와 [수강신청 조사] 중
          // 오직 '선택' 과목만을 대상으로 교과군 선택조건을 엄격히 검토합니다!

          const chosenSubjectsInCat = [];
          const priorSubjectsInCat = [];
          const priorSem1SubjectsInCat = [];
          const priorSem2SubjectsInCat = [];
          const excludedSubjectsInCat = [];

          const isStudentExcluded = (subj) => {
            return (typeof isStudentCategorySubjectExcluded === 'function') &&
              isStudentCategorySubjectExcluded(st.grade, st.classNum, st.studentNum, st.name, cat.id, subj);
          };

          // 1단계: 사전 데이터(기이수 과목) 중 '선택' 과목만 해당 교과군 과목 탐색
          // 1학기/2학기 세부 이력(studentPriorCourseDetails)이 있으면 학기별로 분명하게 분류
          if (studentPriorCourseDetails && studentPriorCourseDetails.length > 0) {
            studentPriorCourseDetails.forEach(cd => {
              const pSubj = cd.subject;
              if (!pSubj) return;
              let cId = getSubjectCategory(pSubj, cat.targetGrade);
              if (!cId) cId = getSubjectCategory(pSubj, null);
              if (!cId) cId = getSubjectCategory(pSubj, '2학년');
              if (!cId) cId = getSubjectCategory(pSubj, '3학년');
              if (!cId) cId = getSubjectCategory(pSubj, '1학년');

              // 학교지정 과목은 교과군 선택 인정에서 원천 제외 ('선택' 과목만 대상)
              // 기이수 과목(통합과학1 등)은 교과군 조건에 온전히 반영

              if (cId === cat.id) {
                if (typeof isSubjectExcludedFromValidation === 'function' && isSubjectExcludedFromValidation(pSubj, cd.grade)) {
                  if (!excludedSubjectsInCat.includes(pSubj)) excludedSubjectsInCat.push(pSubj);
                  return;
                }
                if (isStudentExcluded(pSubj)) {
                  if (!excludedSubjectsInCat.includes(pSubj)) excludedSubjectsInCat.push(pSubj);
                  return;
                }
                if (!priorSubjectsInCat.includes(pSubj)) priorSubjectsInCat.push(pSubj);
                const isSem2 = (cd.source === '학생편성현황' || Number(cd.uploadSem) === 2);
                if (isSem2) {
                  if (!priorSem2SubjectsInCat.includes(pSubj)) priorSem2SubjectsInCat.push(pSubj);
                } else {
                  if (!priorSem1SubjectsInCat.includes(pSubj)) priorSem1SubjectsInCat.push(pSubj);
                }
              }
            });
          } else {
            studentPriorSubjs.forEach(pSubj => {
              if (!pSubj) return;
              let cId = getSubjectCategory(pSubj, cat.targetGrade);
              if (!cId) cId = getSubjectCategory(pSubj, null);
              if (!cId) cId = getSubjectCategory(pSubj, '2학년');
              if (!cId) cId = getSubjectCategory(pSubj, '3학년');
              if (!cId) cId = getSubjectCategory(pSubj, '1학년');

              // 기이수 과목은 교과군 매칭에 온전히 반영

              if (cId === cat.id && !priorSubjectsInCat.includes(pSubj)) {
                priorSubjectsInCat.push(pSubj);
              }
            });
          }

          // 2단계: 수강신청 조사 파일 중 '선택' 과목만 해당 교과군 과목 탐색 ('지정' 제외)
          let surveyPool = [];
          if (cat.targetSemester === '1') surveyPool = studentSem1;
          else if (cat.targetSemester === '2') surveyPool = studentSem2;
          else surveyPool = studentAllChoices;

          surveyPool.forEach(subj => {
            if (isDesignatedSubject(subj)) return; // 지정 과목 제외
            const cId = getSubjectCategory(subj, st.grade);
            if (cId === cat.id) {
              if (typeof isSubjectExcludedFromValidation === 'function' && isSubjectExcludedFromValidation(subj, st.grade)) {
                if (!excludedSubjectsInCat.includes(subj)) excludedSubjectsInCat.push(subj);
                return;
              }
              if (isStudentExcluded(subj)) {
                if (!excludedSubjectsInCat.includes(subj)) excludedSubjectsInCat.push(subj);
                return;
              }
              if (!chosenSubjectsInCat.includes(subj)) {
                chosenSubjectsInCat.push(subj);
              }
            }
          });

          // 3단계: 학기 지정 조건인지, 아니면 연간/누적 조건인지에 따라 최종 인정 과목 구성
          let allSubjectsInCat = [];
          let poolType = 'cumulative';

          if (cat.targetSemester === '1') {
            const combinedSet = new Set(chosenSubjectsInCat);
            priorSem1SubjectsInCat.forEach(pSubj => {
              const normP = (typeof normalizeSubject === 'function') ? normalizeSubject(pSubj) : pSubj;
              const alreadyHas = Array.from(combinedSet).some(cs => ((typeof normalizeSubject === 'function') ? normalizeSubject(cs) : cs) === normP);
              if (!alreadyHas) combinedSet.add(pSubj);
            });
            allSubjectsInCat = Array.from(combinedSet);
            poolType = 'current';
          } else if (cat.targetSemester === '2') {
            const combinedSet = new Set(chosenSubjectsInCat);
            priorSem2SubjectsInCat.forEach(pSubj => {
              const normP = (typeof normalizeSubject === 'function') ? normalizeSubject(pSubj) : pSubj;
              const alreadyHas = Array.from(combinedSet).some(cs => ((typeof normalizeSubject === 'function') ? normalizeSubject(cs) : cs) === normP);
              if (!alreadyHas) combinedSet.add(pSubj);
            });
            allSubjectsInCat = Array.from(combinedSet);
            poolType = 'current';
          } else {
            // 연간/전체 조건: 사전 데이터(기이수) + 수강신청 조사(선택) 모두 합산 인정!
            // (동일 과목 중복 카운트 방지)
            const combinedSet = new Set(chosenSubjectsInCat);
            priorSubjectsInCat.forEach(pSubj => {
              const normP = (typeof normalizeSubject === 'function') ? normalizeSubject(pSubj) : pSubj;
              const alreadyHas = Array.from(combinedSet).some(cs => ((typeof normalizeSubject === 'function') ? normalizeSubject(cs) : cs) === normP);
              if (!alreadyHas) {
                combinedSet.add(pSubj);
              }
            });
            allSubjectsInCat = Array.from(combinedSet);
            poolType = 'cumulative';
          }

          const count = allSubjectsInCat.length;
          const totalCredits = allSubjectsInCat.reduce((sum, subj) => sum + getStep3SubjectCredit(subj, sGrade), 0);
          let isViolated = false;
          let reason = '';

          if (cat.ruleType === 'none') {
            isViolated = false;
            reason = '';
          } else if (cat.ruleType === 'min') {
            const minReq = parseInt(cat.minCount ?? cat.minCredits ?? 0, 10);
            if (count < minReq) {
              isViolated = true;
              reason = `${minReq - count}과목 부족 (${count}/${minReq}개)`;
            }
          } else if (cat.ruleType === 'max') {
            const maxReq = parseInt(cat.maxCount ?? cat.maxCredits ?? 0, 10);
            if (count > maxReq) {
              isViolated = true;
              reason = `${count - maxReq}과목 초과 (${count}/${maxReq}개)`;
            }
          } else if (cat.ruleType === 'range') {
            const minReq = parseInt(cat.minCount ?? cat.minCredits ?? 0, 10);
            const maxReq = parseInt(cat.maxCount ?? cat.maxCredits ?? 0, 10);
            if (count < minReq) {
              isViolated = true;
              reason = `${minReq - count}과목 부족 (${count}/${minReq}개)`;
            } else if (count > maxReq) {
              isViolated = true;
              reason = `${count - maxReq}과목 초과 (${count}/${maxReq}개)`;
            }
          } else if (cat.ruleType === 'exact') {
            const exactReq = parseInt(cat.exactCount ?? cat.exactCredits ?? 0, 10);
            if (count < exactReq) {
              isViolated = true;
              reason = `${exactReq - count}과목 부족 (${count}/${exactReq}개)`;
            } else if (count > exactReq) {
              isViolated = true;
              reason = `${count - exactReq}과목 초과 (${count}/${exactReq}개)`;
            }
          }

          const dynamicRuleDesc = formatStep3RuleDesc(cat);
          const effectivePriorCount = (cat.targetSemester === '1' ? priorSem1SubjectsInCat.length : (cat.targetSemester === '2' ? priorSem2SubjectsInCat.length : priorSubjectsInCat.length));
          const effectivePriorSubjs = (cat.targetSemester === '1' ? priorSem1SubjectsInCat : (cat.targetSemester === '2' ? priorSem2SubjectsInCat : priorSubjectsInCat));

          const evalItem = {
            category: cat,
            poolType: poolType,
            ruleDesc: dynamicRuleDesc,
            count: count,
            credits: totalCredits,
            chosenCount: chosenSubjectsInCat.length,
            priorCount: effectivePriorCount,
            subjects: chosenSubjectsInCat,
            priorSubjects: effectivePriorSubjs,
            allSubjects: allSubjectsInCat,
            excludedSubjects: excludedSubjectsInCat,
            isViolated: isViolated,
            reason: reason
          };

          catEvaluations.push(evalItem);

          if (isViolated) {
            violations.push(evalItem);
            catViolationCounts[cat.id] = (catViolationCounts[cat.id] || 0) + 1;
          }
        });

        // 필수 검증: 학기별 선택과목 미입력(0과목) 여부 자동 검출 (새로 추가된 미수행 학생 등 즉시 점검 필요에 반영)
        if (studentSem1.length === 0 || studentSem2.length === 0) {
          const missingSems = [];
          if (studentSem1.length === 0) missingSems.push('1학기');
          if (studentSem2.length === 0) missingSems.push('2학기');
          const unselectEval = {
            category: {
              id: '__unselected__',
              name: '과목 미신청',
              color: 'rose'
            },
            ruleDesc: `[${st.grade} 필수] 학기별 선택과목 신청 완료`,
            count: 0,
            chosenCount: 0,
            priorCount: 0,
            subjects: [],
            priorSubjects: [],
            allSubjects: [],
            isViolated: true,
            reason: `${missingSems.join('·')} 선택과목 미입력 (0과목)`
          };
          violations.unshift(unselectEval);
          catEvaluations.unshift(unselectEval);
          catViolationCounts['__unselected__'] = (catViolationCounts['__unselected__'] || 0) + 1;
        }

        const crossDupsForSt = st.grade === '2학년' ? crossDupsG2 : crossDupsG3;
        // 통합된 기이수/수강 과목 명부로 중복 탐지 실행 (1학기 + 2학기 과목 모두 실시간 대조)
        const syntheticPriorSt = {
          name: st.name,
          classNum: st.classNum,
          studentNum: st.studentNum,
          subjects: studentPriorSubjs,
          courseDetails: studentPriorCourseDetails
        };
        const priorDataMergedForSt = { students: [syntheticPriorSt] };
        const dupList = detectStudentDuplicates(st, priorDataMergedForSt, crossDupsForSt, (st.grade || '2학년').replace(/[^0-9]/g, ''));
        const hasViol = violations.length > 0;
        const hasDup = dupList.length > 0;

        results.push({
          student: st,
          grade: st.grade,
          classNum: st.classNum,
          studentNum: st.studentNum,
          name: st.name,
          isDuplicateName: !!(matchedG3?.isDuplicateName || matchedG2?.isDuplicateName || matchedCur?.isDuplicateName),
          sem1: studentSem1,
          sem2: studentSem2,
          allChoices: studentAllChoices,
          priorDetails: studentPriorCourseDetails,
          priorSem1: priorSem1Details.map(cd => cd.subject),
          priorSem2: priorSem2Details.map(cd => cd.subject),
          isPass: !hasViol && !hasDup,
          isCategoryPass: !hasViol,
          hasViol: hasViol,
          hasDup: hasDup,
          violations: violations,
          dupList: dupList,
          evaluations: catEvaluations
        });
        } catch (stErr) {
          console.error('[이수과목 검증] 개별 학생 검증 중 예외 발생:', st, stErr);
        }
      });

      results.sort((a, b) => {
        if (a.isPass !== b.isPass) return a.isPass ? 1 : -1;
        if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
        const ca = parseInt(String(a.classNum || '').replace(/[^0-9]/g, ''), 10) || 0;
        const cb = parseInt(String(b.classNum || '').replace(/[^0-9]/g, ''), 10) || 0;
        if (ca !== cb) return ca - cb;
        const sa = parseInt(String(a.studentNum || '').replace(/[^0-9]/g, ''), 10) || 0;
        const sb = parseInt(String(b.studentNum || '').replace(/[^0-9]/g, ''), 10) || 0;
        return sa - sb;
      });

      const passedCount = results.filter(r => r.isPass).length;
      const violatedCount = results.filter(r => r.hasViol).length;
      const duplicateCount = results.filter(r => r.hasDup).length;
      const needGuidanceCount = results.filter(r => !r.isPass).length;

      window._step3LastValidationResult = {
        results: results,
        totalCount: allStudents.length,
        grade2Count: 0,
        grade3Count: allStudents.length,
        passedCount: passedCount,
        violatedCount: violatedCount,
        duplicateCount: duplicateCount,
        needGuidanceCount: needGuidanceCount,
        catViolationCounts: catViolationCounts,
        unmappedSubjects: Array.from(unmappedSubjSet),
        timestamp: new Date()
      };

      renderStep3UI();

      const addedCount = results.filter(r => r.student && r.student.isNewlyAdded).length;

      if (showAlert) {
        if (categories.length === 0 && allStudents.length > 0) {
          alert(`✅ 교과군 선택 조건 검증 완료!
- 검증 대상: 총 ${allStudents.length}명 (3학년 전용 ${allStudents.length}명${addedCount > 0 ? ` / 웹 추가학생 ${addedCount}명 포함` : ''})
- 점검 필요 (위반·중복·미신청): ${needGuidanceCount}명
- 조건 충족 (정상): ${passedCount}명
※ 안내: 등록된 교과군이 아직 없습니다. [1. 교과군 및 조건 등록/관리]에서 교과군 조건을 추가하시면 세부 위반 여부까지 정밀하게 검증됩니다.`);
        } else if (allStudents.length === 0) {
          alert('⚠️ 검증할 3학년 학생 데이터가 없습니다. 학생 수강신청 엑셀 파일을 먼저 업로드해주세요. 학생 수강신청 엑셀 파일을 먼저 업로드해주세요.');
        } else {
          alert(`✅ 교과군 선택 조건 검증 완료!
- 검증 대상: 총 ${allStudents.length}명 (3학년 전용 ${allStudents.length}명${addedCount > 0 ? ` / 웹 추가학생 ${addedCount}명 포함` : ''})
- 점검 필요 학생: ${needGuidanceCount}명 (교과군 위반·미신청 ${violatedCount}명, 과목 중복 ${duplicateCount}명)
- 조건 충족 (정상): ${passedCount}명${unmappedSubjSet.size > 0 ? `
- 교과군 미지정 과목: ${unmappedSubjSet.size}건` : ''}`);
        }
      }

      return window._step3LastValidationResult;
    }

    // =========================================================================
    // 6. SUBJECT CATEGORY MANAGER (전체 시수종합 연동 교과군 및 과목 클릭클릭 배정)
    // =========================================================================

    window._scmActiveCategoryId = null;
    window._scmSubjectFilters = {
      grade: 'all',
      type: 'all',
      catStatus: 'unmapped',
      search: ''
    };
    window._scmFormCurColor = 'blue';
    window._scmHighlightedSubject = null;

    
    // Step 3 Subject Mapping Modal Controller
    window.openStep3MappingModal = function() {
      const modal = document.getElementById('step3MappingModal');
      if (modal) {
        modal.classList.remove('hidden');
        const badge = document.getElementById('step3ModalMappingYearBadge');
        if (badge) badge.textContent = MultiState.activeAcademicYear || '2027학년도';
        if (typeof renderStep3MappingTable === 'function') {
          renderStep3MappingTable();
        }
      }
    };
    window.closeStep3MappingModal = function() {
      const modal = document.getElementById('step3MappingModal');
      if (modal) modal.classList.add('hidden');
    };

    function openSubjectCategoryManagerModal(preferredSubject = null, preferredGrade = null) {
      const modal = document.getElementById('subjectCategoryManagerModal');
      if (!modal) return;

      const sData = getStep3Data();
      const categories = sData.categories || [];

      // Set active category to first one if not set
      if (!window._scmActiveCategoryId || !categories.some(c => c.id === window._scmActiveCategoryId)) {
        window._scmActiveCategoryId = categories.length > 0 ? categories[0].id : null;
      }

      // Reset filters so all subjects are available by default
      window._scmSubjectFilters = {
      grade: 'all',
      type: 'all',
      catStatus: 'unmapped',
      search: ''
    };

      const searchInput = document.getElementById('scmFilterSearch');
      if (searchInput) searchInput.value = '';
      const filterType = document.getElementById('scmFilterType');
      if (filterType) filterType.value = 'all';
      const filterCatStatus = document.getElementById('scmFilterCatStatus');
      if (filterCatStatus) filterCatStatus.value = 'unmapped';

      ['All', '1', '2', '3'].forEach(k => {
        const btn = document.getElementById('scmFilterGrade' + k);
        if (!btn) return;
        if (k === 'All') {
          btn.className = 'px-2 py-0.5 rounded font-black bg-slate-700 text-white shadow-2xs';
        } else {
          btn.className = 'px-2 py-0.5 rounded font-medium text-slate-600 hover:text-slate-900';
        }
      });

      // If preferredSubject passed from table:
      if (preferredSubject) {
        window._scmHighlightedSubject = preferredSubject;
        const catId = getSubjectCategory(preferredSubject, preferredGrade);
        if (catId) {
          window._scmActiveCategoryId = catId;
        }
      } else {
        window._scmHighlightedSubject = null;
      }

      const yearBadge = document.getElementById('scmActiveYearBadge');
      if (yearBadge) yearBadge.textContent = MultiState?.activeAcademicYear || '2027학년도';

      renderScmModal();
      modal.classList.remove('hidden');

      // Scroll smoothly to preferredSubject if present
      if (preferredSubject) {
        setTimeout(() => {
          const card = document.querySelector(`[data-scm-subj="${escapeHtml(preferredSubject)}"]`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 120);
      }
    }
    window.openSubjectCategoryManagerModal = openSubjectCategoryManagerModal;

    function closeSubjectCategoryManagerModal() {
      try {
        const modal = document.getElementById('subjectCategoryManagerModal');
        if (modal) modal.classList.add('hidden');
        if (typeof renderAllGradesCurriculumTable === 'function') renderAllGradesCurriculumTable();
        if (typeof renderStep3UI === 'function') {
          // window._step3LastValidationResult = null;
        }
      } catch (err) {
        console.error('closeSubjectCategoryManagerModal error:', err);
      }
    }
    window.closeSubjectCategoryManagerModal = closeSubjectCategoryManagerModal;

    function renderScmModal() {
      const sData = getStep3Data();
      const categories = sData.categories || [];
      const subjects = getAllCurriculumSubjectsForStep3();

      // 요구사항: '입학생 교육과정' 업로드 파일에 없는 과목은 배정 대기 과목 목록에 배치하기
      if (!sData.manualMappings) sData.manualMappings = {};
      let autoCleaned = false;
      subjects.forEach(cs => {
        const neisInfo = (typeof getSubjectNeisInfo === 'function') ? getSubjectNeisInfo(cs.subject, cs.grade) : null;
        if (!neisInfo) {
          const key = `${cs.grade}::${cs.subject}`;
          // 사용자가 수동으로 이동한 것이 아니라면 배정 대기(미배정) 상태로 유지
          if (!sData.manualMappings[key] && !sData.manualMappings[cs.subject]) {
            if (sData.mappings[key] || sData.mappings[cs.subject]) {
              delete sData.mappings[key];
              delete sData.mappings[cs.subject];
              autoCleaned = true;
            }
          }
        }
      });
      if (autoCleaned) {
        saveStep3Data(sData);
      }

      // Ensure active category is valid
      if (!window._scmActiveCategoryId || !categories.some(c => c.id === window._scmActiveCategoryId)) {
        window._scmActiveCategoryId = categories.length > 0 ? categories[0].id : null;
      }
      const activeCat = categories.find(c => c.id === window._scmActiveCategoryId);

      // Update toolbar summary badge in main allGrades section
      const mainSummaryBadge = document.getElementById('allGradesCategorySummaryBadge');
      if (mainSummaryBadge) {
        mainSummaryBadge.textContent = `${categories.length}개 군`;
      }

      // Left panel header badge
      const catCountBadge = document.getElementById('scmCategoryCountBadge');
      if (catCountBadge) catCountBadge.textContent = `${categories.length}개`;

      // 1. Render Category Selector Tabs / Pills
      const tabsContainer = document.getElementById('scmCategoryTabsContainer');
      if (tabsContainer) {
        if (categories.length === 0) {
          tabsContainer.innerHTML = '<span class="text-xs text-slate-400 p-1">등록된 교과군이 없습니다. [⚡ 표준 교과군 자동 생성] 또는 [+ 교과군 추가]를 클릭하세요.</span>';
        } else {
          tabsContainer.innerHTML = categories.map(cat => {
            const isSel = cat.id === window._scmActiveCategoryId;
            const col = STEP3_COLOR_SCHEMES[cat.color] || STEP3_COLOR_SCHEMES.blue;
            let assignedCount = 0;
            subjects.forEach(cs => {
              if (getSubjectCategory(cs.subject, cs.grade) === cat.id) assignedCount++;
            });

            return `
              <button type="button" 
                      onclick="window.selectScmActiveCategory('${cat.id}')" 
                      ondblclick="window.quickRenameScmCategory('${cat.id}')" 
                      title="클릭: 선택 | 더블클릭: 명칭 변경" 
                      class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSel 
                          ? col.badge + ' ring-2 ring-indigo-400 shadow-2xs font-extrabold scale-[1.02]' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }">
                <span class="w-2 h-2 rounded-full ${col.dot}"></span>
                <span>${cat.name}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-white/80 font-black">${assignedCount}</span>
              </button>
            `;
          }).join('');
        }
      }

      // 2. Render Active Category Detail & Rule Banner
      const bannerEl = document.getElementById('scmActiveCategoryBanner');
      if (bannerEl) {
        if (!activeCat) {
          bannerEl.innerHTML = '<span class="text-xs text-slate-400 italic">교과군을 선택하거나 새로 추가해주세요.</span>';
        } else {
          const col = STEP3_COLOR_SCHEMES[activeCat.color] || STEP3_COLOR_SCHEMES.blue;
          const ruleDesc = formatStep3RuleDesc(activeCat);
          bannerEl.innerHTML = `
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="w-3 h-3 rounded-full ${col.dot}"></span>
                <span class="text-sm font-black text-slate-900 cursor-pointer hover:text-indigo-600 flex items-center gap-1" onclick="window.quickRenameScmCategory('${activeCat.id}')" title="클릭하여 교과군 명칭 즉시 변경">
                  ${activeCat.name}
                  <span class="text-xs text-slate-400 hover:text-indigo-600">✏️</span>
                </span>
                
                <span class="text-[11px] px-2 py-0.5 rounded-full font-bold ${col.badge}">현재 편집 중</span>
              </div>
              <div class="flex items-center gap-1">
                <button type="button" onclick="window.openScmCategoryEditForm('${activeCat.id}')" class="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition cursor-pointer" title="교과군 명칭, 색상, 적용 대상 및 조건 상세 수정">⚙️ 상세 수정</button>
                <button type="button" onclick="window.deleteStep3Category('${activeCat.id}'); window.renderScmModal();" class="px-2 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition cursor-pointer" title="이 교과군 삭제">삭제</button>
              </div>
            </div>
            <div class="text-[11px] text-slate-600 font-medium pt-1">
              <span>📌 <b>선택 조건:</b> ${ruleDesc}</span>
            </div>
          `;
        }
      }

      // 3. Render LEFT PANEL: Subjects Assigned to Active Category
      const leftContainer = document.getElementById('scmLeftSubjectsContainer');
      const leftBadge = document.getElementById('scmLeftAssignedCountBadge');
      const leftAssignedSubjs = activeCat 
        ? subjects.filter(cs => getSubjectCategory(cs.subject, cs.grade) === activeCat.id) 
        : [];

      if (leftBadge) leftBadge.textContent = `${leftAssignedSubjs.length}과목 배정됨`;

      if (leftContainer) {
        if (!activeCat) {
          leftContainer.innerHTML = '<div class="p-8 text-center text-slate-400 font-medium">선택된 교과군이 없습니다.</div>';
        } else if (leftAssignedSubjs.length === 0) {
          leftContainer.innerHTML = `
            <div class="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
              <span class="text-2xl">📥</span>
              <p class="text-xs font-bold text-slate-700">아직 [ ${activeCat.name} ]에 배정된 과목이 없습니다.</p>
              <p class="text-[11px] text-slate-400">오른쪽 목록에서 과목을 클릭하면 이쪽(왼쪽)으로 즉시 이동합니다.</p>
            </div>
          `;
        } else {
          leftContainer.innerHTML = leftAssignedSubjs.map(cs => {
            const isHighlighted = window._scmHighlightedSubject && (cs.subject === window._scmHighlightedSubject);
            const statusBadge = cs.status === '폐강'
              ? '<span class="text-[9px] px-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">폐강</span>'
              : '';
            const isExcluded = (typeof isSubjectExcludedFromValidation === 'function') ? isSubjectExcludedFromValidation(cs.subject, cs.grade) : false;
            const neisInfo = (typeof getSubjectNeisInfo === 'function') ? getSubjectNeisInfo(cs.subject, cs.grade) : null;
            const subjTypeBadge = cs.subjectType || neisInfo?.subjectType || '';

            return `
              <div data-scm-subj="${escapeHtml(cs.subject)}"
                   onclick="window.moveSubjectToRight('${encodeURIComponent(cs.grade)}', '${encodeURIComponent(cs.subject)}')" 
                   class="group p-2.5 rounded-xl border border-indigo-200 bg-white hover:border-rose-300 hover:bg-rose-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-3xs hover:scale-[1.008] select-none ${isHighlighted ? 'ring-2 ring-amber-400 bg-amber-50/50' : ''}"
                   title="클릭 시 왼쪽 목록에서 제외되어 오른쪽으로 이동합니다">
                
                <div class="flex items-center gap-2 min-w-0 flex-wrap">
                  <div class="flex items-center gap-1 shrink-0">
                    <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">${cs.grade} ${cs.semester}학기</span>
                    <span class="text-[10px] font-medium px-1 py-0.2 rounded border ${cs.category === '지정' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-sky-50 text-sky-700 border-sky-200'}">${cs.category || '선택'}</span>
                    ${subjTypeBadge ? `<span class="text-[9px] font-bold px-1 py-0.2 rounded ${subjTypeBadge === '공통' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">${subjTypeBadge}</span>` : ''}
                    ${(subjTypeBadge === '공통' || neisInfo?.isCommon) ? `<span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 shadow-3xs" title="입학생 교육과정 편성표 '공통' 과목으로 검증에서 제외됩니다">검증 제외 (공통)</span>` : ''}
                    ${!neisInfo ? `<span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 shadow-3xs" title="입학생 교육과정 편성표 파일에 없는 과목입니다">⚠️ 편성표 외 과목</span>` : ''}
                    ${statusBadge}
                  </div>
                  <div class="font-extrabold text-xs sm:text-sm text-slate-800 truncate">
                    ${cs.subject}
                  </div>
                  <div class="text-[11px] text-slate-400 shrink-0 font-medium">
                    (${cs.hours}시수 | ${cs.teacher || '미배정'})
                  </div>
                </div>

                <div class="shrink-0 flex items-center gap-2">
                  <label class="flex items-center gap-1 text-[11px] cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0 bg-slate-50" onclick="event.stopPropagation();" title="체크 시 이수과목 조건 검증에서 제외됩니다 (공통과목 기본 제외)">
                    <input type="checkbox" ${isExcluded ? 'checked' : ''} onchange="window.toggleSubjectValidationExclusion('${cs.grade}', '${escapeHtml(cs.subject)}', this.checked); event.stopPropagation();" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
                    <span class="text-[10px] ${isExcluded ? 'text-amber-800 font-extrabold' : 'text-slate-500'}">검증제외</span>
                  </label>
                  <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 group-hover:bg-rose-100 group-hover:text-rose-700 flex items-center gap-1 shadow-3xs transition">
                    <span>➔ 제외</span>
                  </span>
                </div>

              </div>
            `;
          }).join('');
        }
      }

      // 4. Update Right Panel Header Notice
      const rightTargetName = document.getElementById('scmRightTargetCategoryName');
      if (rightTargetName) {
        rightTargetName.textContent = activeCat ? activeCat.name : '선택된 교과군';
      }

      // 5. Render RIGHT PANEL: Subjects NOT in Active Category
      const filter = window._scmSubjectFilters;
      let rightAvailableSubjs = subjects.filter(cs => {
        // Exclude subjects that already belong to ACTIVE category
        const catId = getSubjectCategory(cs.subject, cs.grade);
        if (activeCat && catId === activeCat.id) return false;

        if (filter.grade !== 'all' && cs.grade !== filter.grade) return false;
        const csNeisInfo = (typeof getSubjectNeisInfo === 'function') ? getSubjectNeisInfo(cs.subject, cs.grade) : null;
        const isNonNeis = !csNeisInfo;

        if (filter.type === '선택' && cs.category !== '선택' && cs.category !== '학생선택') return false;
        if (filter.type === '지정' && cs.category !== '지정' && cs.category !== '학교지정') return false;
        if (filter.type === 'nonNeis' && !isNonNeis) return false;

        if (filter.catStatus === 'unmapped') {
          if (catId) return false;
        } else if (filter.catStatus === 'otherMapped') {
          if (!catId) return false;
        }

        if (filter.search.trim()) {
          const q = filter.search.trim().toLowerCase();
          const matchSubj = (cs.subject || '').toLowerCase().includes(q);
          const matchTeacher = (cs.teacher || '').toLowerCase().includes(q);
          if (!matchSubj && !matchTeacher) return false;
        }

        return true;
      });

      const rightBadge = document.getElementById('scmRightAvailableCountBadge');
      if (rightBadge) rightBadge.textContent = `${rightAvailableSubjs.length}과목 대기`;

      const rightContainer = document.getElementById('scmSubjectCardsContainer');
      if (rightContainer) {
        if (!activeCat) {
          rightContainer.innerHTML = '<div class="p-8 text-center text-slate-400 font-medium">왼쪽에서 교과군을 먼저 선택해주세요.</div>';
        } else if (rightAvailableSubjs.length === 0) {
          rightContainer.innerHTML = '<div class="p-8 text-center text-slate-400 font-medium">조건에 해당하는 대기 과목이 없습니다. <button type="button" onclick="window.resetScmSubjectFilters()" class="text-indigo-600 underline font-bold ml-1 cursor-pointer">전체 보기</button></div>';
        } else {
          rightContainer.innerHTML = rightAvailableSubjs.map(cs => {
            const assignedCatId = getSubjectCategory(cs.subject, cs.grade);
            const otherCat = assignedCatId ? categories.find(c => c.id === assignedCatId) : null;
            const otherCol = otherCat ? (STEP3_COLOR_SCHEMES[otherCat.color] || STEP3_COLOR_SCHEMES.blue) : null;
            const isHighlighted = window._scmHighlightedSubject && (cs.subject === window._scmHighlightedSubject);

            const statusBadge = cs.status === '폐강'
              ? '<span class="text-[9px] px-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">폐강</span>'
              : '';
            const isExcluded = (typeof isSubjectExcludedFromValidation === 'function') ? isSubjectExcludedFromValidation(cs.subject, cs.grade) : false;
            const neisInfo = (typeof getSubjectNeisInfo === 'function') ? getSubjectNeisInfo(cs.subject, cs.grade) : null;
            const subjTypeBadge = cs.subjectType || neisInfo?.subjectType || '';

            return `
              <div data-scm-subj="${escapeHtml(cs.subject)}"
                   onclick="window.moveSubjectToLeft('${encodeURIComponent(cs.grade)}', '${encodeURIComponent(cs.subject)}')" 
                   class="group p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-3xs hover:scale-[1.008] select-none ${isHighlighted ? 'ring-2 ring-amber-400 bg-amber-50/50' : ''}"
                   title="클릭 시 왼쪽 [ ${activeCat.name} ] 교과군으로 이동합니다">
                
                <div class="flex items-center gap-2 min-w-0 flex-wrap">
                  <div class="flex items-center gap-1 shrink-0">
                    <span class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">${cs.grade} ${cs.semester}학기</span>
                    <span class="text-[10px] font-medium px-1 py-0.2 rounded border ${cs.category === '지정' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-sky-50 text-sky-700 border-sky-200'}">${cs.category || '선택'}</span>
                    ${subjTypeBadge ? `<span class="text-[9px] font-bold px-1 py-0.2 rounded ${subjTypeBadge === '공통' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">${subjTypeBadge}</span>` : ''}
                    ${(subjTypeBadge === '공통' || neisInfo?.isCommon) ? `<span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 shadow-3xs" title="입학생 교육과정 편성표 '공통' 과목으로 검증에서 제외됩니다">검증 제외 (공통)</span>` : ''}
                    ${!neisInfo ? `<span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 shadow-3xs" title="입학생 교육과정 편성표 파일에 없는 과목입니다">⚠️ 편성표 외 과목</span>` : ''}
                    ${statusBadge}
                  </div>
                  <div class="font-extrabold text-xs sm:text-sm text-slate-800 truncate">
                    ${cs.subject}
                  </div>
                  <div class="text-[11px] text-slate-400 shrink-0 font-medium">
                    (${cs.hours}시수 | ${cs.teacher || '미배정'})
                  </div>
                </div>

                <div class="shrink-0 flex items-center gap-1.5">
                  <label class="flex items-center gap-1 text-[11px] cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0 bg-slate-50" onclick="event.stopPropagation();" title="체크 시 이수과목 조건 검증에서 제외됩니다 (공통과목 기본 제외)">
                    <input type="checkbox" ${isExcluded ? 'checked' : ''} onchange="window.toggleSubjectValidationExclusion('${cs.grade}', '${escapeHtml(cs.subject)}', this.checked); event.stopPropagation();" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" />
                    <span class="text-[10px] ${isExcluded ? 'text-amber-800 font-extrabold' : 'text-slate-500'}">검증제외</span>
                  </label>
                  ${otherCat ? `
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full ${otherCol ? otherCol.badge : 'bg-slate-100 text-slate-600'} border" title="현재 ${otherCat.name} 교과군">
                      다른군: ${otherCat.name}
                    </span>
                  ` : `
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 border border-dashed border-slate-200">
                      미지정
                    </span>
                  `}
                  <span class="text-[11px] font-bold px-2.5 py-0.8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white flex items-center gap-1 shadow-3xs transition">
                    <span>⬅️ 담기</span>
                  </span>
                </div>

              </div>
            `;
          }).join('');
        }
      }

      // 6. Update Footer stats
      const footerEl = document.getElementById('scmFooterSummaryText');
      if (footerEl) {
        let assignedCount = 0;
        subjects.forEach(cs => {
          if (getSubjectCategory(cs.subject, cs.grade)) assignedCount++;
        });
        const activeName = activeCat ? activeCat.name : '선택 없음';
        footerEl.textContent = `통계: 현재 [${activeName}] 소속 ${leftAssignedSubjs.length}과목 | 전체 배정 완료 ${assignedCount}과목 / 미지정 ${subjects.length - assignedCount}과목 (총 ${subjects.length}과목)`;
      }
    }
    window.renderScmModal = renderScmModal;

    function selectScmActiveCategory(catId) {
      window._scmActiveCategoryId = catId;
      window._scmHighlightedSubject = null;
      renderScmModal();

      // 수정 폼(scmCategoryFormWrapper)이 열려 있는 상태라면 선택한 교과군 정보로 즉시 내용 자동 갱신
      const wrapper = document.getElementById('scmCategoryFormWrapper');
      if (wrapper && !wrapper.classList.contains('hidden')) {
        openScmCategoryEditForm(catId);
      }
    }
    window.selectScmActiveCategory = selectScmActiveCategory;

    // Movement: RIGHT TO LEFT (Add to active category)
    function moveSubjectToLeft(grade, subject) {
      try {
        if (typeof grade === 'string' && grade.includes('%')) grade = decodeURIComponent(grade);
        if (typeof subject === 'string' && subject.includes('%')) subject = decodeURIComponent(subject);
      } catch (e) {}

      const activeCatId = window._scmActiveCategoryId;
      if (!activeCatId) {
        alert('먼저 왼쪽에서 배정할 교과군을 선택해주세요.');
        return;
      }
      const sData = getStep3Data();
      if (!sData.mappings) sData.mappings = {};
      if (!sData.manualMappings) sData.manualMappings = {};

      const key = `${grade}::${subject}`;
      const normSubject = (typeof normalizeSubject === 'function') ? normalizeSubject(subject) : subject.trim();
      const normKey = `${grade}::${normSubject}`;

      sData.mappings[key] = activeCatId;
      sData.mappings[subject] = activeCatId;
      sData.mappings[normKey] = activeCatId;
      sData.mappings[normSubject] = activeCatId;

      // 사용자가 직접 교과군에 배정한 과목으로 명시적 등록 (편성표 외 과목 자동 삭제 방지)
      sData.manualMappings[key] = true;
      sData.manualMappings[subject] = true;
      sData.manualMappings[normKey] = true;
      sData.manualMappings[normSubject] = true;

      saveStep3Data(sData);
      renderScmModal();
      if (typeof renderStep3SubjectMappingTable === 'function') renderStep3SubjectMappingTable();
      window._step3LastValidationResult = null;
    }
    window.moveSubjectToLeft = moveSubjectToLeft;

    // Movement: LEFT TO RIGHT (Remove from active category)
    function moveSubjectToRight(grade, subject) {
      try {
        if (typeof grade === 'string' && grade.includes('%')) grade = decodeURIComponent(grade);
        if (typeof subject === 'string' && subject.includes('%')) subject = decodeURIComponent(subject);
      } catch (e) {}

      const sData = getStep3Data();
      if (!sData.mappings) return;
      if (!sData.manualMappings) sData.manualMappings = {};

      const key = `${grade}::${subject}`;
      const normSubject = (typeof normalizeSubject === 'function') ? normalizeSubject(subject) : subject.trim();
      const normKey = `${grade}::${normSubject}`;

      delete sData.mappings[key];
      delete sData.mappings[subject];
      delete sData.mappings[normKey];
      delete sData.mappings[normSubject];

      delete sData.manualMappings[key];
      delete sData.manualMappings[subject];
      delete sData.manualMappings[normKey];
      delete sData.manualMappings[normSubject];

      saveStep3Data(sData);
      renderScmModal();
      if (typeof renderStep3SubjectMappingTable === 'function') renderStep3SubjectMappingTable();
      window._step3LastValidationResult = null;
    }
    window.moveSubjectToRight = moveSubjectToRight;

    function setScmSubjectFilter(key, value) {
      window._scmSubjectFilters[key] = value;
      ['All', '1', '2', '3'].forEach(k => {
        const btn = document.getElementById('scmFilterGrade' + k);
        if (!btn) return;
        const targetVal = k === 'All' ? 'all' : (k + '학년');
        if (window._scmSubjectFilters.grade === targetVal) {
          btn.className = 'px-2 py-0.5 rounded font-black bg-slate-700 text-white shadow-2xs';
        } else {
          btn.className = 'px-2 py-0.5 rounded font-medium text-slate-600 hover:text-slate-900';
        }
      });
      renderScmModal();
    }
    window.setScmSubjectFilter = setScmSubjectFilter;

    function resetScmSubjectFilters() {
      window._scmSubjectFilters = {
      grade: 'all',
      type: 'all',
      catStatus: 'unmapped',
      search: ''
    };
      const searchInput = document.getElementById('scmFilterSearch');
      if (searchInput) searchInput.value = '';
      const filterType = document.getElementById('scmFilterType');
      if (filterType) filterType.value = 'all';
      const filterCatStatus = document.getElementById('scmFilterCatStatus');
      if (filterCatStatus) filterCatStatus.value = 'unmapped';
      ['All', '1', '2', '3'].forEach(k => {
        const btn = document.getElementById('scmFilterGrade' + k);
        if (!btn) return;
        if (k === 'All') {
          btn.className = 'px-2 py-0.5 rounded font-black bg-slate-700 text-white shadow-2xs';
        } else {
          btn.className = 'px-2 py-0.5 rounded font-medium text-slate-600 hover:text-slate-900';
        }
      });
      window._scmHighlightedSubject = null;
      renderScmModal();
    }
    window.resetScmSubjectFilters = resetScmSubjectFilters;

    function clearScmSearch() {
      const searchInput = document.getElementById('scmFilterSearch');
      if (searchInput) searchInput.value = '';
      window._scmSubjectFilters.search = '';
      renderScmModal();
    }
    window.clearScmSearch = clearScmSearch;

    // Inline Category Form handling
    function toggleScmCategoryForm(show = true) {
      const wrapper = document.getElementById('scmCategoryFormWrapper');
      if (!wrapper) return;
      if (show) {
        document.getElementById('scmFormCatId').value = '';
        document.getElementById('scmFormName').value = '';
        document.getElementById('scmFormGrade').value = '전체';
        document.getElementById('scmFormSemester').value = 'all';
        document.getElementById('scmFormTitle').textContent = '새 교과군 등록';
        renderScmColorPicker('blue');
        const minRadio = document.querySelector('input[name="scmFormRuleType"][value="min"]');
        if (minRadio) minRadio.checked = true;
        updateScmFormRuleInputs();
        wrapper.classList.remove('hidden');
        document.getElementById('scmFormName')?.focus();
      } else {
        wrapper.classList.add('hidden');
      }
    }
    window.toggleScmCategoryForm = toggleScmCategoryForm;

    function openScmCategoryEditForm(catId) {
      const sData = getStep3Data();
      const cat = (sData.categories || []).find(c => c.id === catId);
      if (!cat) return;

      const wrapper = document.getElementById('scmCategoryFormWrapper');
      if (!wrapper) return;

      document.getElementById('scmFormCatId').value = cat.id;
      document.getElementById('scmFormName').value = cat.name;
      document.getElementById('scmFormGrade').value = cat.targetGrade || '전체';
      document.getElementById('scmFormSemester').value = cat.targetSemester || 'all';
      document.getElementById('scmFormTitle').textContent = '교과군 명칭 및 조건 수정: ' + cat.name;

      renderScmColorPicker(cat.color || 'blue');

      const radio = document.querySelector(`input[name="scmFormRuleType"][value="${cat.ruleType || 'min'}"]`);
      if (radio) radio.checked = true;

      window._scmFormCurRuleValues = {
        minCount: cat.minCredits ?? cat.minCount ?? 4,
        maxCount: cat.maxCredits ?? cat.maxCount ?? 12,
        minCredits: cat.minCredits ?? cat.minCount ?? 4,
        maxCredits: cat.maxCredits ?? cat.maxCount ?? 12
      };

      updateScmFormRuleInputs();
      wrapper.classList.remove('hidden');
      const nameInput = document.getElementById('scmFormName');
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }
    window.openScmCategoryEditForm = openScmCategoryEditForm;

    function quickRenameScmCategory(catId) {
      const sData = getStep3Data();
      const cat = (sData.categories || []).find(c => c.id === catId);
      if (!cat) return;

      const currentName = cat.name || '';
      const newName = prompt('[' + currentName + '] 교과군의 새로운 명칭을 입력하세요:', currentName);
      if (newName === null) return;
      const trimmed = newName.trim();
      if (!trimmed) {
        alert('교과군 명칭을 입력해주세요.');
        return;
      }
      if (trimmed === currentName) return;

      cat.name = trimmed;
      saveStep3Data(sData);
      renderScmModal();
      if (typeof renderAllGradesCurriculumTable === 'function') {
        renderAllGradesCurriculumTable();
      }
      // window._step3LastValidationResult = null;
    }
    window.quickRenameScmCategory = quickRenameScmCategory;

    function renderScmColorPicker(activeColor = 'blue') {
      window._scmFormCurColor = activeColor;
      const picker = document.getElementById('scmFormColorPicker');
      if (!picker) return;

      picker.innerHTML = Object.keys(STEP3_COLOR_SCHEMES).map(cKey => {
        const col = STEP3_COLOR_SCHEMES[cKey];
        const isSel = col.key === activeColor;
        return `
          <button type="button" onclick="window.selectScmColor('${col.key}')" class="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${col.badge} ${isSel ? 'ring-2 ' + col.ring + ' font-black' : 'opacity-70'}">
            <span class="w-2 h-2 rounded-full ${col.dot}"></span>
            <span>${col.label}</span>
          </button>
        `;
      }).join('');
    }

    function selectScmColor(colorKey) {
      renderScmColorPicker(colorKey);
    }
    window.selectScmColor = selectScmColor;

    window._scmFormCurRuleValues = { minCount: 4, maxCount: 12, minCredits: 4, maxCredits: 12 };

    function updateScmFormRuleInputs() {
      const selectedRadio = document.querySelector('input[name="scmFormRuleType"]:checked');
      const rType = selectedRadio ? selectedRadio.value : 'min';
      const container = document.getElementById('scmFormRuleInputsContainer');
      if (!container) return;

      if (rType === 'none') {
        container.innerHTML = `<span class="text-xs font-bold text-slate-500 italic py-1">선택 조건 없음</span>`;
      } else if (rType === 'min') {
        container.innerHTML = `
          <span class="text-xs font-medium text-slate-700">최소</span>
          <input type="number" id="scmInputMinCount" value="${window._scmFormCurRuleValues.minCount ?? window._scmFormCurRuleValues.minCredits ?? 1}" min="1" max="20" oninput="window.updateScmFormPreview()" class="w-16 text-xs border border-indigo-300 rounded px-2 py-0.5 font-bold text-center">
          <span class="text-xs font-medium text-slate-700">개 이상</span>
        `;
      } else if (rType === 'max') {
        container.innerHTML = `
          <span class="text-xs font-medium text-slate-700">최대</span>
          <input type="number" id="scmInputMaxCount" value="${window._scmFormCurRuleValues.maxCount ?? window._scmFormCurRuleValues.maxCredits ?? 3}" min="1" max="20" oninput="window.updateScmFormPreview()" class="w-16 text-xs border border-indigo-300 rounded px-2 py-0.5 font-bold text-center">
          <span class="text-xs font-medium text-slate-700">개 이하</span>
        `;
      }

      updateScmFormPreview();
    }
    window.updateScmFormRuleInputs = updateScmFormRuleInputs;

    function updateScmFormPreview() {
      const selectedRadio = document.querySelector('input[name="scmFormRuleType"]:checked');
      const rType = selectedRadio ? selectedRadio.value : 'min';
      const grade = document.getElementById('scmFormGrade')?.value || '전체';
      const sem = document.getElementById('scmFormSemester')?.value || 'all';

      const minVal = parseInt(document.getElementById('scmInputMinCount')?.value || 4, 10);
      const maxVal = parseInt(document.getElementById('scmInputMaxCount')?.value || 12, 10);

      window._scmFormCurRuleValues = { minCount: minVal, maxCount: maxVal, minCredits: minVal, maxCredits: maxVal };

      const dummyCat = {
        targetGrade: grade,
        targetSemester: sem,
        ruleType: rType,
        minCredits: minVal,
        maxCredits: maxVal,
        minCount: minVal,
        maxCount: maxVal
      };

      const previewEl = document.getElementById('scmFormRuleSummaryPreview');
      if (previewEl) previewEl.textContent = formatStep3RuleDesc(dummyCat);
    }
    window.updateScmFormPreview = updateScmFormPreview;

    function showScmSaveNotice() {
      let toast = document.getElementById('scmSaveNoticeModalToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'scmSaveNoticeModalToast';
        toast.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100000] px-6 py-3.5 bg-slate-900/95 text-white text-sm font-extrabold rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700/80 pointer-events-none transition-all duration-200 transform scale-95 opacity-0';
        document.body.appendChild(toast);
      }
      toast.innerHTML = '<span class="text-emerald-400 text-lg">✅</span> <span>저장되었습니다</span>';
      toast.classList.remove('opacity-0', 'scale-95');
      toast.classList.add('opacity-100', 'scale-100');

      if (window._scmSaveNoticeTimer) clearTimeout(window._scmSaveNoticeTimer);
      window._scmSaveNoticeTimer = setTimeout(() => {
        toast.classList.remove('opacity-100', 'scale-100');
        toast.classList.add('opacity-0', 'scale-95');
      }, 1000);
    }
    window.showScmSaveNotice = showScmSaveNotice;

    function saveScmCategoryFromForm() {
      const idInput = document.getElementById('scmFormCatId');
      const nameInput = document.getElementById('scmFormName');
      const gradeSelect = document.getElementById('scmFormGrade');
      const semSelect = document.getElementById('scmFormSemester');
      const selectedRadio = document.querySelector('input[name="scmFormRuleType"]:checked');

      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        alert('교과군 이름을 입력해주세요.');
        if (nameInput) nameInput.focus();
        return;
      }

      const catId = idInput?.value || ('cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));
      const grade = gradeSelect ? gradeSelect.value : '전체';
      const sem = semSelect ? semSelect.value : 'all';
      const rType = selectedRadio ? selectedRadio.value : 'min';

      const minVal = parseInt(document.getElementById('scmInputMinCount')?.value || 1, 10);
      const maxVal = parseInt(document.getElementById('scmInputMaxCount')?.value || 3, 10);

      const sData = getStep3Data();
      if (!Array.isArray(sData.categories)) sData.categories = [];

      const newCat = {
        id: catId,
        name: name,
        color: window._scmFormCurColor || 'blue',
        targetGrade: grade,
        targetSemester: sem,
        ruleType: rType,
        minCredits: minVal,
        maxCredits: maxVal,
        minCount: minVal,
        maxCount: maxVal
      };

      const existingIdx = sData.categories.findIndex(c => c.id === catId);
      if (existingIdx >= 0) {
        sData.categories[existingIdx] = newCat;
      } else {
        sData.categories.push(newCat);
      }

      window._scmActiveCategoryId = catId;
      _excludedSubjectCache.clear();
      saveStep3Data(sData);

      // [요구사항] 저장 시 상세조정 화면을 닫지 않고 유지하며, '저장되었습니다' 알림창이 1초 나타났다 사라지도록 처리
      const titleEl = document.getElementById('scmFormTitle');
      if (titleEl) titleEl.textContent = '교과군 명칭 및 조건 수정: ' + name;
      renderScmModal();
      showScmSaveNotice();

      // 모달 화면이 즉각(0초) 닫히고 반응하도록 배경 재연산 및 전체시수표 갱신은 비동기 지연 실행
      setTimeout(() => {
        if (typeof renderAllGradesCurriculumTable === 'function') {
          renderAllGradesCurriculumTable();
        }
        // window._step3LastValidationResult = null;
      }, 16);
    }
    window.saveScmCategoryFromForm = saveScmCategoryFromForm;
    window.getStep3Data = getStep3Data;
    window.getAllCurriculumSubjectsForStep3 = getAllCurriculumSubjectsForStep3;
    window.runStep3Validation = runStep3Validation;

    // 학년별 1·2학기 선택과목을 교과군별 열로 묶어 '1,2학기 통합 배치표' 양식으로 엑셀 다운로드
    function exportCurriculumByCategoryExcel() {
      try {
        const curriculum = (typeof getAllGradesCurriculum === 'function') ? getAllGradesCurriculum() : [];
        // 구분 === '선택'인 과목만 포함 (개설/폐강 여부 상관없이 전부 포함)
        const electives = curriculum.filter(c => c && c.subject && String(c.category || '').trim() === '선택');

        if (electives.length === 0) {
          alert('편제표에 등록된 선택과목 데이터가 없습니다. 먼저 기초데이터(편제표)를 업로드하거나 선택과목을 등록해주세요.');
          return;
        }

        const acadYearStr = MultiState?.activeAcademicYear || '2027학년도';
        const sData = (typeof getStep3Data === 'function') ? getStep3Data() : { categories: [] };
        const allCategories = Array.isArray(sData.categories) ? sData.categories : [];

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

        const wb = XLSX.utils.book_new();
        const targetGrades = ['1학년', '2학년', '3학년'].filter(g => electives.some(c => c.grade === g));

        targetGrades.forEach(gradeStr => {
          const gradeElectives = electives.filter(c => c.grade === gradeStr);

          // 이 학년의 과목들이 매핑된 교과군 ID 집합 확인
          const usedCatIds = new Set();
          let hasUnassigned = false;

          gradeElectives.forEach(c => {
            const catId = (typeof getSubjectCategory === 'function') ? getSubjectCategory(c.subject, gradeStr) : null;
            if (catId && allCategories.some(cat => cat.id === catId)) {
              usedCatIds.add(catId);
            } else {
              hasUnassigned = true;
            }
          });

          // 해당 학년에 적용되는 교과군 목록 구성 (전체/해당 학년 대상 교과군 + 실제 배정된 교과군)
          const colCategories = allCategories.filter(cat =>
            !cat.targetGrade || cat.targetGrade === '전체' || cat.targetGrade === gradeStr || usedCatIds.has(cat.id)
          ).map(cat => ({ id: cat.id, name: cat.name }));

          if (hasUnassigned || colCategories.length === 0) {
            colCategories.push({ id: '__unassigned__', name: '미지정' });
          }

          const totalCols = Math.max(colCategories.length, 1);

          // 학기별·교과군별 순수 과목명 배열(중복 제거) 생성 함수
          const buildSemesterGroups = (semNum) => {
            const semItems = gradeElectives.filter(c => Number(c.semester) === semNum);
            return colCategories.map(colCat => {
              const subjList = [];
              const seenNorm = new Set();

              semItems.forEach(c => {
                const mappedCatId = (typeof getSubjectCategory === 'function') ? getSubjectCategory(c.subject, gradeStr) : null;
                const effectiveCatId = (mappedCatId && allCategories.some(cat => cat.id === mappedCatId))
                  ? mappedCatId
                  : '__unassigned__';

                if (effectiveCatId !== colCat.id) return;

                const cleanSubj = String(
                  c.baseSubject ||
                  (typeof getBaseSubjectName === 'function' ? getBaseSubjectName(c.subject) : c.subject) ||
                  c.subject ||
                  ''
                ).trim();
                if (!cleanSubj) return;

                const normKey = (typeof normalizeSubject === 'function')
                  ? normalizeSubject(cleanSubj)
                  : cleanSubj.replace(/\s+/g, '');
                if (!seenNorm.has(normKey)) {
                  seenNorm.add(normKey);
                  subjList.push(cleanSubj);
                }
              });

              return subjList;
            });
          };

          const groups1 = buildSemesterGroups(1);
          const groups2 = buildSemesterGroups(2);
          const totalSem1Count = groups1.reduce((acc, g) => acc + g.length, 0);
          const totalSem2Count = groups2.reduce((acc, g) => acc + g.length, 0);

          const rows = [];
          const merges = [];
          const rowHeights = [];

          // Row 0: Sheet Title
          const titleRow = [`${acadYearStr} ${gradeStr} 1·2학기 교과군별 선택과목 편제표`];
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

          // --- SECTION 1: 1학기 교과군별 선택과목 편제표 ---
          const sem1BannerR = rows.length;
          const sem1BannerText = `📘 [1학기] 교과군별 선택과목 편제표 (총 ${colCategories.length}개 교과군 / ${totalSem1Count}과목)`;
          const sem1BannerRow = [sem1BannerText];
          for (let c = 1; c < totalCols; c++) sem1BannerRow.push('');
          rows.push(sem1BannerRow);
          merges.push({ s: { r: sem1BannerR, c: 0 }, e: { r: sem1BannerR, c: totalCols - 1 } });
          rowHeights.push({ hpt: 26 });

          // 1학기 교과군 헤더행
          const sem1HeaderR = rows.length;
          const sem1HeaderRow = colCategories.map(cat => cat.name);
          rows.push(sem1HeaderRow);
          rowHeights.push({ hpt: 28 });

          // 1학기 과목 데이터행들
          const maxLen1 = groups1.length > 0 ? Math.max(...groups1.map(g => g.length), 0) : 0;
          const sem1DataStartR = rows.length;
          const len1 = Math.max(maxLen1, 1);
          for (let r = 0; r < len1; r++) {
            const row = [];
            for (let gIdx = 0; gIdx < totalCols; gIdx++) {
              if (totalSem1Count === 0) {
                row.push(r === 0 && gIdx === 0 ? '(1학기 선택과목 데이터 없음)' : '');
              } else {
                row.push((groups1[gIdx] && groups1[gIdx][r]) ? groups1[gIdx][r] : '');
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

          // --- SECTION 2: 2학기 교과군별 선택과목 편제표 ---
          const sem2BannerR = rows.length;
          const sem2BannerText = `📗 [2학기] 교과군별 선택과목 편제표 (총 ${colCategories.length}개 교과군 / ${totalSem2Count}과목)`;
          const sem2BannerRow = [sem2BannerText];
          for (let c = 1; c < totalCols; c++) sem2BannerRow.push('');
          rows.push(sem2BannerRow);
          merges.push({ s: { r: sem2BannerR, c: 0 }, e: { r: sem2BannerR, c: totalCols - 1 } });
          rowHeights.push({ hpt: 26 });

          // 2학기 교과군 헤더행
          const sem2HeaderR = rows.length;
          const sem2HeaderRow = colCategories.map(cat => cat.name);
          rows.push(sem2HeaderRow);
          rowHeights.push({ hpt: 28 });

          // 2학기 과목 데이터행들
          const maxLen2 = groups2.length > 0 ? Math.max(...groups2.map(g => g.length), 0) : 0;
          const sem2DataStartR = rows.length;
          const len2 = Math.max(maxLen2, 1);
          for (let r = 0; r < len2; r++) {
            const row = [];
            for (let gIdx = 0; gIdx < totalCols; gIdx++) {
              if (totalSem2Count === 0) {
                row.push(r === 0 && gIdx === 0 ? '(2학기 선택과목 데이터 없음)' : '');
              } else {
                row.push((groups2[gIdx] && groups2[gIdx][r]) ? groups2[gIdx][r] : '');
              }
            }
            rows.push(row);
            rowHeights.push({ hpt: 24 });
          }

          const ws = XLSX.utils.aoa_to_sheet(rows);
          ws['!merges'] = merges;
          ws['!rows'] = rowHeights;

          // 열 너비 설정 (교과군 명칭이나 과목명 길이에 맞춰 최소 22 이상 자동 조절)
          const getVisualWidth = (str) => {
            if (!str) return 0;
            let w = 0;
            for (let i = 0; i < str.length; i++) {
              w += str.charCodeAt(i) > 127 ? 2 : 1;
            }
            return w;
          };
          ws['!cols'] = colCategories.map((cat, gIdx) => {
            let maxW = getVisualWidth(cat.name);
            (groups1[gIdx] || []).forEach(s => { maxW = Math.max(maxW, getVisualWidth(s)); });
            (groups2[gIdx] || []).forEach(s => { maxW = Math.max(maxW, getVisualWidth(s)); });
            return { wch: Math.max(22, maxW + 6) };
          });

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
            ExcelStyler.setCell(ws, sem1HeaderR, gIdx, {
              font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: gTheme.headerText } },
              fill: { fgColor: { rgb: gTheme.headerBg } },
              alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
              border: {
                top: { style: 'medium', color: { rgb: gTheme.border } },
                bottom: { style: 'medium', color: { rgb: gTheme.border } },
                left: { style: 'thin', color: { rgb: 'CBD5E1' } },
                right: { style: 'thin', color: { rgb: 'CBD5E1' } }
              }
            });
          }

          // Styling Section 1 Data Cells
          for (let r = 0; r < len1; r++) {
            const isEven = r % 2 === 1;
            for (let gIdx = 0; gIdx < totalCols; gIdx++) {
              const val = (groups1[gIdx] && groups1[gIdx][r]) ? groups1[gIdx][r] : '';
              ExcelStyler.setCell(ws, sem1DataStartR + r, gIdx, {
                font: { name: ExcelStyler.fontFamily, sz: 10, bold: !!val, color: { rgb: val ? '0F172A' : '94A3B8' } },
                fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
                alignment: { horizontal: 'center', vertical: 'center' },
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
            ExcelStyler.setCell(ws, sem2HeaderR, gIdx, {
              font: { name: ExcelStyler.fontFamily, sz: 10, bold: true, color: { rgb: gTheme.headerText } },
              fill: { fgColor: { rgb: gTheme.headerBg } },
              alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
              border: {
                top: { style: 'medium', color: { rgb: gTheme.border } },
                bottom: { style: 'medium', color: { rgb: gTheme.border } },
                left: { style: 'thin', color: { rgb: 'CBD5E1' } },
                right: { style: 'thin', color: { rgb: 'CBD5E1' } }
              }
            });
          }

          // Styling Section 2 Data Cells
          for (let r = 0; r < len2; r++) {
            const isEven = r % 2 === 1;
            for (let gIdx = 0; gIdx < totalCols; gIdx++) {
              const val = (groups2[gIdx] && groups2[gIdx][r]) ? groups2[gIdx][r] : '';
              ExcelStyler.setCell(ws, sem2DataStartR + r, gIdx, {
                font: { name: ExcelStyler.fontFamily, sz: 10, bold: !!val, color: { rgb: val ? '0F172A' : '94A3B8' } },
                fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: softBorder
              });
            }
          }

          const sheetName = `${gradeStr}_1,2학기_교과군별편제표`.substring(0, 31);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        const fileName = buildExportFileName('교과군별 선택과목 편제표', 'xlsx');
        window.saveExcelFile(wb, fileName);
      } catch (err) {
        console.error('exportCurriculumByCategoryExcel error:', err);
        alert('교과군별 선택과목 엑셀 다운로드 중 오류가 발생했습니다: ' + (err.message || err));
      }
    }
    window.exportCurriculumByCategoryExcel = exportCurriculumByCategoryExcel;

    // Subtab switching
    function switchStep3SubTab(tabName) {
      _step3ActiveSubTab = tabName;

      const btnResults = document.getElementById('step3SubTabBtnResults');
      const btnCategories = document.getElementById('step3SubTabBtnCategories');
      const btnMappings = document.getElementById('step3SubTabBtnMappings');

      const viewResults = document.getElementById('step3SubViewResults');
      const viewCategories = document.getElementById('step3SubViewCategories');
      const viewMappings = document.getElementById('step3SubViewMappings');

      const activeBtnCls = ['bg-white', 'text-indigo-700', 'shadow-xs', 'ring-1', 'ring-slate-200', 'font-black'];
      const inactiveBtnCls = ['text-slate-600', 'font-bold', 'hover:text-slate-900'];

      [btnResults, btnCategories, btnMappings].forEach(b => {
        if (b) {
          b.classList.remove(...activeBtnCls);
          b.classList.add(...inactiveBtnCls);
        }
      });

      if (viewResults) viewResults.classList.add('hidden');
      if (viewCategories) viewCategories.classList.add('hidden');
      if (viewMappings) viewMappings.classList.add('hidden');

      if (tabName === 'results') {
        if (btnResults) {
          btnResults.classList.remove(...inactiveBtnCls);
          btnResults.classList.add(...activeBtnCls);
        }
        if (viewResults) viewResults.classList.remove('hidden');
      } else if (tabName === 'categories') {
        if (btnCategories) {
          btnCategories.classList.remove(...inactiveBtnCls);
          btnCategories.classList.add(...activeBtnCls);
        }
        if (viewCategories) viewCategories.classList.remove('hidden');
      } else if (tabName === 'mappings') {
        if (btnMappings) {
          btnMappings.classList.remove(...inactiveBtnCls);
          btnMappings.classList.add(...activeBtnCls);
        }
        if (viewMappings) viewMappings.classList.remove('hidden');
      }

      renderStep3UI();
    }
    window.switchStep3SubTab = switchStep3SubTab;

    // Filter updates
    function setStep3ResultFilter(key, value) {
      _step3ResultFilters[key] = value;
      renderStep3ValidationResults();
    }
    window.setStep3ResultFilter = setStep3ResultFilter;

    function clearSearchInput(inputId) {
      const el = document.getElementById(inputId);
      if (!el) return;
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    window.clearSearchInput = clearSearchInput;

    function setStep3MappingFilter(key, value) {
      _step3MappingFilters[key] = value;
      renderStep3SubjectMappingTable();
    }
    window.setStep3MappingFilter = setStep3MappingFilter;

    // Main Render for Step 3
    function renderStep3StandbyUI() {
      const sData = getStep3Data();
      const categories = sData.categories || [];
      const { grade3Students } = getStep3StudentsData();
      const candidateCount = grade3Students?.length || 0;

      const totalEl = document.getElementById('step3StatTotalStudents');
      const gradeDetailEl = document.getElementById('step3StatGradeDetail');
      const passEl = document.getElementById('step3StatPassStudents');
      const passRateEl = document.getElementById('step3StatPassRate');
      const violEl = document.getElementById('step3StatViolatedStudents');
      const violRateEl = document.getElementById('step3StatViolatedRate');
      const catCountEl = document.getElementById('step3StatCategoryCount');
      const unmappedNoticeEl = document.getElementById('step3StatUnmappedNotice');

      if (totalEl) totalEl.textContent = candidateCount > 0 ? candidateCount : '-';
      if (gradeDetailEl) gradeDetailEl.textContent = '(3학년 대상)';
      if (passEl) passEl.textContent = '-';
      if (passRateEl) passRateEl.textContent = '(대기 중)';
      if (violEl) violEl.textContent = '-';
      if (violRateEl) violRateEl.textContent = '(대기 중)';
      if (catCountEl) catCountEl.textContent = categories.length;
      if (unmappedNoticeEl) unmappedNoticeEl.textContent = '점검 대기';

      const resultsContainer = document.getElementById('step3SubViewResults');
      if (resultsContainer) {
        resultsContainer.innerHTML = `
          <div class="p-10 sm:p-14 text-center border-2 border-dashed border-purple-200 rounded-3xl bg-white shadow-xs space-y-4 my-4">
            <span class="text-4xl sm:text-5xl block animate-bounce">📋</span>
            <h3 class="text-lg sm:text-xl font-black text-slate-800">이수학점 점검 준비 완료</h3>
            <p class="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              3학년 학생들의 <b>수강신청 내역(선택과목)</b> 및 1단계 <b>교과학습발달상황(2학년 1학기 선택과목)</b>을 대조하여<br>
              교과군별 이수 기준 및 과목 중복 수강 여부를 점검합니다.<br>
              아래 <b>[🚀 점검 시작]</b> 버튼을 누르면 점검이 시작됩니다.
            </p>
            <div class="pt-2">
              <button type="button" onclick="window.runStep3Validation(true)" class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-black text-sm rounded-2xl shadow-lg transition cursor-pointer transform hover:scale-105 ring-4 ring-amber-200">
                <span class="text-base">🚀</span>
                <span>점검 시작</span>
              </button>
            </div>
          </div>
        `;
      }
    }
    window.renderStep3StandbyUI = renderStep3StandbyUI;

    function renderStep3UI() {
      const sData = getStep3Data();
      const categories = sData.categories || [];
      const acadYear = MultiState?.activeAcademicYear || '2027학년도';

      const yearBadge = document.getElementById('step3ActiveYearBadge');
      if (yearBadge) yearBadge.textContent = acadYear;

      if (!window._step3LastValidationResult) {
        // 아직 '점검 시작' 버튼을 누르지 않은 상태: 점검 대기 안내 화면 렌더링
        renderStep3StandbyUI();
        return;
      }

      const val = window._step3LastValidationResult;

      const totalEl = document.getElementById('step3StatTotalStudents');
      const gradeDetailEl = document.getElementById('step3StatGradeDetail');
      const passEl = document.getElementById('step3StatPassStudents');
      const passRateEl = document.getElementById('step3StatPassRate');
      const violEl = document.getElementById('step3StatViolatedStudents');
      const violRateEl = document.getElementById('step3StatViolatedRate');
      const catCountEl = document.getElementById('step3StatCategoryCount');
      const unmappedNoticeEl = document.getElementById('step3StatUnmappedNotice');

      if (totalEl) totalEl.textContent = val.totalCount;
      if (gradeDetailEl) gradeDetailEl.textContent = `(2학년 ${val.grade2Count}, 3학년 ${val.grade3Count})`;

      const needCount = val.needGuidanceCount !== undefined ? val.needGuidanceCount : val.violatedCount;
      const pRate = val.totalCount > 0 ? ((val.passedCount / val.totalCount) * 100).toFixed(0) : 0;
      const vRate = val.totalCount > 0 ? ((needCount / val.totalCount) * 100).toFixed(0) : 0;

      if (passEl) passEl.textContent = val.passedCount;
      if (passRateEl) passRateEl.textContent = `(${pRate}%)`;
      if (violEl) violEl.textContent = needCount;
      if (violRateEl) violRateEl.textContent = `(${vRate}% - 위반 ${val.violatedCount || 0}, 중복 ${val.duplicateCount || 0})`;

      if (catCountEl) catCountEl.textContent = categories.length;
      if (unmappedNoticeEl) {
        unmappedNoticeEl.textContent = val.unmappedSubjects.length > 0 
          ? `/ 미지정 ${val.unmappedSubjects.length}개 ⚠️`
          : '/ 미지정 0개';
      }

      const tabViolBadge = document.getElementById('step3TabViolatedBadge');
      const tabCatBadge = document.getElementById('step3TabCategoryBadge');
      const tabMapBadge = document.getElementById('step3TabMappingBadge');

      if (tabViolBadge) {
        const needCnt = val.needGuidanceCount !== undefined ? val.needGuidanceCount : val.violatedCount;
        tabViolBadge.textContent = `${needCnt}명 점검 필요`;
        tabViolBadge.className = needCnt > 0 
          ? 'px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-100 text-rose-800'
          : 'px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800';
      }
      if (tabCatBadge) tabCatBadge.textContent = categories.length;
      if (tabMapBadge) tabMapBadge.textContent = Object.keys(sData.mappings || {}).length + '과목';

      const warnBanner = document.getElementById('step3ResultsWarningBanner');
      const warnText = document.getElementById('step3ResultsWarningText');
      if (warnBanner && warnText) {
        const priorG2 = (typeof getPriorDataForGrade === 'function') ? getPriorDataForGrade('2학년') : null;
        const priorG3 = (typeof getPriorDataForGrade === 'function') ? getPriorDataForGrade('3학년') : null;
        const hasPriorData = !!((priorG2 && priorG2.students && priorG2.students.length > 0) || (priorG3 && priorG3.students && priorG3.students.length > 0));

        if (categories.length === 0) {
          warnText.textContent = '등록된 교과군이 없습니다. [1. 교과군 및 조건 등록/관리]에서 교과군과 제한 조건을 먼저 등록해주세요.';
          warnBanner.className = 'p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs';
          warnBanner.classList.remove('hidden');
        } else if (val.unmappedSubjects.length > 0) {
          warnText.textContent = `교과군이 지정되지 않은 과목이 ${val.unmappedSubjects.length}개 있습니다 (${val.unmappedSubjects.slice(0, 4).join(', ')}...). [2. 과목별 교과군 지정 매핑]에서 교과군을 배정해주세요.`;
          warnBanner.className = 'p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs';
          warnBanner.classList.remove('hidden');
        } else if (hasPriorData) {
          const g3PriorCount = (priorG3 && priorG3.students) ? priorG3.students.length : 0;
          const g2PriorCount = (priorG2 && priorG2.students) ? priorG2.students.length : 0;
          warnText.innerHTML = `<span class="flex items-center gap-1.5"><span class="text-sm">📌</span><span><b>사전 데이터 연동 완료:</b> 3학년(${g3PriorCount}명)·2학년(${g2PriorCount}명)의 사전 등록 기이수 과목이 [전학년 누적] 교과군 선택 조건 검증에 정상 반영되고 있습니다.</span></span>`;
          warnBanner.className = 'p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs';
          warnBanner.classList.remove('hidden');
        } else {
          warnBanner.classList.add('hidden');
        }
      }

      if (_step3ActiveSubTab === 'results') {
        renderStep3ValidationResults();
      } else if (_step3ActiveSubTab === 'categories') {
        renderStep3CategoryList();
      } else if (_step3ActiveSubTab === 'mappings') {
        renderStep3SubjectMappingTable();
      }
    }
    window.renderStep3UI = renderStep3UI;

    function renderStep3ValidationResults() {
      const val = window._step3LastValidationResult;
      if (!val) return;

      const sData = getStep3Data();
      const categories = sData.categories || [];

      const btnA = document.getElementById('step3FilterStatusAll');
      const btnV = document.getElementById('step3FilterStatusViolated');
      const btnP = document.getElementById('step3FilterStatusPass');
      const btnAdd = document.getElementById('step3FilterStatusAdded');
      const cntA = document.getElementById('step3FilterCountAll');
      const cntV = document.getElementById('step3FilterCountViolated');
      const cntP = document.getElementById('step3FilterCountPass');
      const cntAdd = document.getElementById('step3FilterCountAdded');

      const needCount = val.needGuidanceCount !== undefined ? val.needGuidanceCount : val.violatedCount;
      const addedCount = val.results.filter(r => r.student && r.student.isNewlyAdded).length;

      if (cntA) cntA.textContent = `(${val.totalCount})`;
      if (cntV) cntV.textContent = `(${needCount})`;
      if (cntP) cntP.textContent = `(${val.passedCount})`;
      if (cntAdd) cntAdd.textContent = `(${addedCount})`;

      const filterGradeEl = document.getElementById('step3FilterGrade');
      if (filterGradeEl) {
        filterGradeEl.innerHTML = `
          <option value="3학년" selected>3학년 전용 검증 (${val.totalCount}명)</option>
        `;
        filterGradeEl.value = '3학년';
      }

      // 반 필터 드롭다운을 현재 결과 데이터 기반으로 동적 구성
      const classSelect = document.getElementById('step3FilterClass');
      if (classSelect) {
        const availableClasses = new Set();
        val.results.forEach(stRes => {
          if (_step3ResultFilters.grade === 'all' || stRes.grade === _step3ResultFilters.grade) {
            const cleanC = String(stRes.classNum || '').replace(/[^0-9]/g, '');
            if (cleanC) availableClasses.add(cleanC);
          }
        });
        const sortedClasses = Array.from(availableClasses).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
        let classHtml = '<option value="all">전체 반</option>';
        sortedClasses.forEach(c => {
          classHtml += `<option value="${c}" ${_step3ResultFilters.classNum === c ? 'selected' : ''}>${c}반</option>`;
        });
        classSelect.innerHTML = classHtml;
      }

      const curStatus = _step3ResultFilters.status || 'all';
      [btnA, btnV, btnP, btnAdd].forEach(b => {
        if (b) b.className = 'px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 transition';
      });

      if (curStatus === 'all' && btnA) {
        btnA.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition bg-indigo-600 text-white shadow-xs';
      } else if (curStatus === 'violated' && btnV) {
        btnV.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition bg-rose-600 text-white shadow-xs';
      } else if (curStatus === 'pass' && btnP) {
        btnP.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition bg-emerald-600 text-white shadow-xs';
      } else if (curStatus === 'added' && btnAdd) {
        btnAdd.className = 'px-3 py-1.5 rounded-lg text-xs font-black transition bg-purple-600 text-white shadow-xs';
      }

      const catSelect = document.getElementById('step3FilterCategory');
      if (catSelect) {
        const curCatVal = _step3ResultFilters.categoryId;
        let optHtml = '<option value="all">모든 교과군</option>';
        if (val.catViolationCounts['__unselected__'] > 0) {
          optHtml += `<option value="__unselected__" ${curCatVal === '__unselected__' ? 'selected' : ''}>⚠️ 선택과목 미신청 (${val.catViolationCounts['__unselected__']}명)</option>`;
        }
        categories.forEach(c => {
          const violCnt = val.catViolationCounts[c.id] || 0;
          optHtml += `<option value="${c.id}" ${curCatVal === c.id ? 'selected' : ''}>${c.name} (${violCnt}명 위반)</option>`;
        });
        catSelect.innerHTML = optHtml;
      }

      const tbody = document.getElementById('step3ResultsTableBody');
      const emptyState = document.getElementById('step3ResultsEmptyState');
      const countBadge = document.getElementById('step3TableResultCount');

      const hasSearch = !!(_step3ResultFilters.search && _step3ResultFilters.search.trim());

      let filtered = val.results.filter(stRes => {
        // 검색어가 입력된 경우 상태 탭(위반/정상/추가)과 무관하게 해당 학생을 직접 검색
        if (!hasSearch) {
          if (_step3ResultFilters.status === 'violated' && stRes.isPass) return false;
          if (_step3ResultFilters.status === 'pass' && !stRes.isPass) return false;
          if (_step3ResultFilters.status === 'added' && (!stRes.student || !stRes.student.isNewlyAdded)) return false;
        }

        if (_step3ResultFilters.grade !== 'all' && stRes.grade !== _step3ResultFilters.grade) return false;
        if (_step3ResultFilters.classNum !== 'all') {
          const stC = String(stRes.classNum || '').replace(/[^0-9]/g, '');
          const fC = String(_step3ResultFilters.classNum || '').replace(/[^0-9]/g, '');
          if (stC !== fC) return false;
        }

        if (_step3ResultFilters.categoryId !== 'all') {
          if (_step3ResultFilters.categoryId === '__unselected__') {
            const hasUnselect = stRes.violations.some(v => v.category && v.category.id === '__unselected__');
            if (!hasUnselect) return false;
          } else {
            const hasCatViol = stRes.violations.some(v => v.category && v.category.id === _step3ResultFilters.categoryId);
            if (!hasCatViol) return false;
          }
        }

        if (hasSearch) {
          const q = _step3ResultFilters.search.trim().toLowerCase();
          const matchName = (stRes.name || '').toLowerCase().includes(q);
          const matchId = String(stRes.studentNum || '').includes(q);
          const matchClass = `${stRes.grade} ${stRes.classNum}반`.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchClass) return false;
        }

        return true;
      });

      if (countBadge) countBadge.textContent = `${filtered.length}명 표시 중`;

      if (!tbody) return;

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');

      tbody.innerHTML = filtered.map((item, idx) => {
        const isPass = item.isPass;
        const hasViol = !!item.hasViol;
        const hasDup = !!item.hasDup;

        let rowBg = '';
        if (isPass) {
          rowBg = (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50');
        } else if (hasViol && hasDup) {
          rowBg = 'bg-rose-50/60 hover:bg-rose-100/60';
        } else if (hasViol) {
          rowBg = 'bg-rose-50/40 hover:bg-rose-50/70';
        } else {
          rowBg = 'bg-amber-50/40 hover:bg-amber-50/70';
        }

        let violHtml = '';
        if (!hasViol) {
          violHtml = '<span class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">✅ 모든 교과군 이수 조건 충족</span>';
        } else {
          violHtml = '<div class="space-y-1.5">';
          item.violations.forEach(v => {
            const cat = v.category;
            const cColor = cat ? (STEP3_COLOR_SCHEMES[cat.color] || STEP3_COLOR_SCHEMES.blue) : STEP3_COLOR_SCHEMES.blue;
            violHtml += `
              <div class="p-1.5 rounded-lg border border-rose-200 bg-white/90 shadow-2xs space-y-0.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10px] font-black px-1.5 py-0.2 rounded ${cColor.badge}">${cat ? cat.name : '교과군'}</span>
                  <span class="text-[10px] font-bold text-slate-500">${v.ruleDesc}</span>
                </div>
                <div class="text-xs font-bold text-rose-800 flex items-center gap-1">
                  <span>🚨${v.reason}</span>
                </div>
              </div>
            `;
          });
          violHtml += '</div>';
        }

        let chosenInCatHtml = '';
        if (!hasViol) {
          // 정상 학생의 경우에도 교과군별로 인정된 과목(사전 1·2학기 포함) 요약 표시
          const satisfiedCats = (item.evaluations || []).filter(e => !e.isViolated && e.allSubjects && e.allSubjects.length > 0);
          if (satisfiedCats.length === 0) {
            chosenInCatHtml = '<span class="text-emerald-700 text-xs font-bold">✅ 전원 충족</span>';
          } else {
            chosenInCatHtml = '<div class="space-y-1">';
            satisfiedCats.forEach(v => {
              const cat = v.category;
              const cColor = cat ? (STEP3_COLOR_SCHEMES[cat.color] || STEP3_COLOR_SCHEMES.blue) : STEP3_COLOR_SCHEMES.blue;
              const totalInCat = v.allSubjects.length;
              const chosenPills = (v.subjects || []).map(s => `
                <span class="text-[10px] font-extrabold px-1.5 py-0.2 rounded ${cColor.badge} border shadow-2xs" title="3학년 수강신청 선택과목">${s}</span>
              `).join('');
              const priorPills = (v.priorSubjects || []).map(s => {
                const isSem2 = (item.priorDetails || []).some(cd => (cd.subject === s || cd.normSubject === s) && (cd.source === '학생편성현황' || Number(cd.uploadSem) === 2));
                const badgeStyle = isSem2
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-sky-50 text-sky-800 border-sky-300';
                const label = isSem2 ? '[2학기수강]' : '[1학기이수(선택)]';
                return `<span class="text-[10px] font-bold px-1.5 py-0.2 rounded border shadow-2xs ${badgeStyle}" title="1단계 사전데이터 인정 과목">${label} ${s}</span>`;
              }).join('');

              const excludedPills = (v.excludedSubjects || []).map(s => 
                `<span class="text-[10px] font-bold line-through text-slate-400 bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded shadow-3xs" title="예외처리되어 카운트 제외됨">${s} (제외)</span>`
              ).join(' ');

              chosenInCatHtml += `
                <div class="py-0.5 px-1.5 rounded bg-white/80 border border-slate-200 text-[10px] flex items-center justify-between gap-1 flex-wrap">
                  <div class="flex items-center gap-1 flex-wrap">
                    <span class="font-black text-slate-700 mr-1">[${cat ? cat.name : ''}] 총 ${v.credits ?? (totalInCat * 4)}학점 (${totalInCat}과목):</span>
                    ${chosenPills} ${priorPills} ${excludedPills}
                  </div>
                  <button type="button" 
                          onclick="window.openStudentCategoryExceptionModal('${item.grade}', '${item.classNum}', '${item.studentNum}', decodeURIComponent('${encodeURIComponent(item.name || '')}'), '${cat ? cat.id : ''}')" 
                          class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer shadow-3xs shrink-0 select-none" 
                          title="${item.name} 학생의 [${cat ? cat.name : ''}] 선택 과목 예외(카운트 제외) 관리">
                    <span>✏️</span>
                    <span>예외</span>
                  </button>
                </div>
              `;
            });
            chosenInCatHtml += '</div>';
          }
        } else {
          chosenInCatHtml = '<div class="space-y-1.5">';
          item.violations.forEach(v => {
            const cat = v.category;
            const cColor = cat ? (STEP3_COLOR_SCHEMES[cat.color] || STEP3_COLOR_SCHEMES.blue) : STEP3_COLOR_SCHEMES.blue;
            const totalInCat = (v.allSubjects && v.allSubjects.length > 0) ? v.allSubjects.length : v.subjects.length;
            if (totalInCat === 0) {
              const excludedPills = (v.excludedSubjects || []).map(s => 
                `<span class="text-[10px] font-bold line-through text-slate-400 bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded shadow-3xs" title="예외처리되어 카운트 제외됨">${s} (제외)</span>`
              ).join(' ');

              chosenInCatHtml += `
                <div class="py-1 px-2 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-500 text-xs flex items-center justify-between gap-1 flex-wrap">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="italic text-slate-400">[${cat ? cat.name : ''}] 해당 교과군 인정 과목 없음 (0개)</span>
                    ${excludedPills}
                  </div>
                  <button type="button" 
                          onclick="window.openStudentCategoryExceptionModal('${item.grade}', '${item.classNum}', '${item.studentNum}', decodeURIComponent('${encodeURIComponent(item.name || '')}'), '${cat ? cat.id : ''}')" 
                          class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer shadow-3xs select-none" 
                          title="${item.name} 학생의 [${cat ? cat.name : ''}] 선택 과목 예외(카운트 제외) 관리">
                    <span>✏️</span>
                    <span>예외</span>
                  </button>
                </div>
              `;
            } else {
              const chosenPills = (v.subjects || []).map(s => `
                <span class="text-[11px] font-extrabold px-1.5 py-0.5 rounded ${cColor.badge} border shadow-2xs" title="3학년 수강신청 선택과목">${s}</span>
              `).join('');
              const priorPills = (v.priorSubjects || []).map(s => {
                const isSem2 = (item.priorDetails || []).some(cd => (cd.subject === s || cd.normSubject === s) && (cd.source === '학생편성현황' || Number(cd.uploadSem) === 2));
                const badgeStyle = isSem2
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-sky-50 text-sky-800 border-sky-300';
                const label = isSem2 ? '[2학기수강]' : '[1학기이수(선택)]';
                return `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-2xs ${badgeStyle}" title="1단계 사전데이터 인정 과목">${label} ${s}</span>`;
              }).join('');

              const excludedPills = (v.excludedSubjects || []).map(s => 
                `<span class="text-[10px] font-bold line-through text-slate-400 bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded shadow-3xs" title="예외처리되어 카운트 제외됨">${s} (제외)</span>`
              ).join(' ');

              chosenInCatHtml += `
                <div class="py-1 px-2 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1">
                  <div class="flex items-center justify-between text-[10px] font-black text-slate-600">
                    <div class="flex items-center gap-1.5">
                      <span>[${cat ? cat.name : ''}] 총 인정 ${v.credits ?? (totalInCat * 4)}학점 (${totalInCat}과목)</span>
                      <button type="button" 
                              onclick="window.openStudentCategoryExceptionModal('${item.grade}', '${item.classNum}', '${item.studentNum}', decodeURIComponent('${encodeURIComponent(item.name || '')}'), '${cat ? cat.id : ''}')" 
                              class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer shadow-3xs select-none" 
                              title="${item.name} 학생의 [${cat ? cat.name : ''}] 선택 과목 예외(카운트 제외) 관리">
                        <span>✏️</span>
                        <span>예외</span>
                      </button>
                    </div>
                    ${v.priorCount > 0 ? `<span class="text-indigo-600 font-bold">(선택 ${v.chosenCount} + 기이수/수강 ${v.priorCount})</span>` : ''}
                  </div>
                  <div class="flex flex-wrap gap-1 items-center">
                    ${chosenPills}
                    ${priorPills}
                    ${excludedPills}
                  </div>
                </div>
              `;
            }
          });
          chosenInCatHtml += '</div>';
        }

        const renderSubjTag = (subj, optClass = '') => {
          const cId = getSubjectCategory(subj, item.grade);
          const cat = cId ? categories.find(c => c.id === cId) : null;
          const cColor = cat ? (STEP3_COLOR_SCHEMES[cat.color] || STEP3_COLOR_SCHEMES.blue) : null;
          const tagClass = optClass || (cColor ? cColor.badge : 'bg-slate-100 text-slate-600 border-slate-200');
          const title = cat ? `${subj} [${cat.name}]` : `${subj} [교과군 미지정]`;
          return `<span class="text-[10px] font-bold px-1.5 py-0.2 rounded ${tagClass} border" title="${title}">${subj}</span>`;
        };

        const sem1Tags = (item.sem1 || []).map(s => renderSubjTag(s)).join('');
        const sem2Tags = (item.sem2 || []).map(s => renderSubjTag(s)).join('');

        const priorSem1Tags = (item.priorSem1 || []).map(s => renderSubjTag(s, 'bg-sky-50 text-sky-800 border-sky-300')).join('');
        const priorSem2Tags = (item.priorSem2 || []).map(s => renderSubjTag(s, 'bg-emerald-50 text-emerald-800 border-emerald-300')).join('');

        let statusBadgeHtml = '';
        if (isPass) {
          statusBadgeHtml = '<span class="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">정상</span>';
        } else if (hasViol && hasDup) {
          statusBadgeHtml = `
            <div class="inline-flex flex-col items-center gap-1">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">위반 ${item.violations.length}</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">중복 ${item.dupList.length}</span>
            </div>
          `;
        } else if (hasViol) {
          statusBadgeHtml = `<span class="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">위반 ${item.violations.length}</span>`;
        } else {
          statusBadgeHtml = `<span class="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">중복 ${item.dupList.length}</span>`;
        }

        // 1단계의 '동일·기이수 과목 중복신청 의심 명단'과 동일한 표시 형식: 과목명 (n학기 / 중복 시기)
        let dupBadgesHtml = '';
        if (hasDup && Array.isArray(item.dupList) && item.dupList.length > 0) {
          const badges = item.dupList.map(d => {
            const isPrior = d.sourceType === 'prior_grade';
            const badgeStyle = isPrior
              ? 'bg-rose-100 text-rose-800 border-rose-300'
              : 'bg-amber-100 text-amber-900 border-amber-300';
            return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${badgeStyle} mr-1 mb-0.5" title="${d.sourceLabel}">${d.subject} (${d.semester}학기 / ${d.sourceLabel})</span>`;
          }).filter((v, i, a) => a.indexOf(v) === i).join('');
          dupBadgesHtml = `<div class="flex flex-wrap items-center">${badges}</div>`;
        } else {
          dupBadgesHtml = '<span class="text-slate-400 text-xs">-</span>';
        }

        return `
          <tr class="${rowBg} transition-colors">
            <td class="py-3 px-3 text-center font-black text-slate-700 whitespace-nowrap">${item.grade}</td>
            <td class="py-3 px-3 text-center font-bold text-slate-600 whitespace-nowrap">${item.classNum}반 ${item.studentNum}번</td>
            <td class="py-3 px-4 text-center font-black text-slate-900 whitespace-nowrap">
              <div class="inline-flex items-center gap-1.5">
                <span>${item.name}</span>
                ${item.isDuplicateName ? '<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300" title="사전 데이터에 동일 성명이 2명 이상 존재합니다. 반·번호를 확인해주세요.">⚠️동명이인</span>' : ''}
                ${item.student && item.student.isNewlyAdded ? '<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200" title="2단계에서 추가된 학생">추가</span>' : ''}
              </div>
            </td>
            <td class="py-3 px-3 text-center whitespace-nowrap">
              ${statusBadgeHtml}
            </td>
            <td class="py-3 px-4">${violHtml}</td>
            <td class="py-3 px-4">${dupBadgesHtml}</td>
            <td class="py-3 px-4">${chosenInCatHtml}</td>
            <td class="py-3 px-4">
              <div class="space-y-1.5">
                <!-- 3학년 수강신청 조사 과목 -->
                <div class="p-1 rounded bg-slate-50/90 border border-slate-200/90 space-y-1">
                  <div class="flex items-center justify-between text-[10px] font-black text-slate-600">
                    <span>[3학년 수강신청 조사]</span>
                  </div>
                  <div class="flex items-start gap-1.5">
                    <span class="text-[10px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">1학기:</span>
                    <div class="flex items-center gap-1 flex-wrap flex-1">
                      ${sem1Tags || '<span class="text-slate-400 text-[10px]">선택 없음</span>'}
                    </div>
                  </div>
                  <div class="flex items-start gap-1.5">
                    <span class="text-[10px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded shrink-0">2학기:</span>
                    <div class="flex items-center gap-1 flex-wrap flex-1">
                      ${sem2Tags || '<span class="text-slate-400 text-[10px]">선택 없음</span>'}
                    </div>
                  </div>
                </div>

                <!-- 1단계 사전데이터 (1학기 기이수 + 2학기 수강 과목) -->
                <div class="p-1 rounded bg-amber-50/40 border border-amber-200/70 space-y-1">
                  <div class="flex items-center justify-between text-[10px] font-black text-amber-900">
                    <span>[1단계 사전데이터 연동]</span>
                    <span class="text-[9px] text-amber-700 font-bold">2학년 1학기 선택 + 2학기 수강</span>
                  </div>
                  <div class="flex items-start gap-1.5">
                    <span class="text-[10px] font-black text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded shrink-0">1학기 기이수(선택):</span>
                    <div class="flex items-center gap-1 flex-wrap flex-1">
                      ${priorSem1Tags || '<span class="text-slate-400 text-[10px]">기록 없음</span>'}
                    </div>
                  </div>
                  <div class="flex items-start gap-1.5">
                    <span class="text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">2학기 수강중:</span>
                    <div class="flex items-center gap-1 flex-wrap flex-1">
                      ${priorSem2Tags || '<span class="text-slate-400 text-[10px]">기록 없음</span>'}
                    </div>
                  </div>
                </div>
              </div>
            </td>
            <td class="py-3 px-3 text-center whitespace-nowrap">
              <button type="button"
                onclick="window.openStudentPriorSubjectModal('${item.grade}', '${item.classNum}', '${item.studentNum}', decodeURIComponent('${encodeURIComponent(item.name || '')}'))"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition shadow-2xs cursor-pointer"
                title="${item.name} 학생의 사전 기이수 과목 직접 추가/관리">
                <span>✏️ 과목 관리</span>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    // ==========================================
    // 학생별 기이수 과목 직접 관리 (수동 보정) 모달 제어
    // ==========================================
    let _currentPriorEditingStudent = null;
    let _lastPriorSubjectCredit = 4;
    let _validPriorSubjectCatalog = []; // 목록 내에서만 선택할 수 있는 유효 과목 풀

    try {
      const savedCr = localStorage.getItem('LAST_PRIOR_SUBJECT_CREDIT');
      if (savedCr) {
        const p = parseFloat(savedCr);
        if (!isNaN(p) && p > 0) _lastPriorSubjectCredit = p;
      }
    } catch (e) {}

    function buildValidPriorSubjectCatalog() {
      const allKnownSubjs = new Set();

      // 1) 편제표 '선택' 과목 (지정 제외)
      const curriculumAll = (typeof getAllGradesCurriculum === 'function') ? getAllGradesCurriculum() : [];
      curriculumAll.forEach(c => {
        if (c && c.subject && c.category !== '지정' && c.category !== '학교지정') {
          const cleanS = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(c.subject) : c.subject.trim();
          if (cleanS) allKnownSubjs.add(cleanS);
        }
      });

      // 2) 사전데이터 '선택' 과목 (지정 제외)
      const priorDataG2 = getPriorDataForGrade('2학년');
      const priorDataG3 = getPriorDataForGrade('3학년');
      [priorDataG2, priorDataG3].forEach(pd => {
        if (pd && Array.isArray(pd.courses)) {
          pd.courses.forEach(c => {
            const org = c.organization || '';
            if (org.includes('지정') || org.includes('학교지정')) return;
            const cleanS = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(c.subject) : (c.subject || '').trim();
            if (cleanS) allKnownSubjs.add(cleanS);
          });
        }
      });

      _validPriorSubjectCatalog = Array.from(allKnownSubjs).sort((a, b) => a.localeCompare(b, 'ko'));
      return _validPriorSubjectCatalog;
    }

    function openStudentPriorSubjectModal(grade, classNum, studentNum, name) {
      const cNum = String(classNum || '').replace(/[^0-9]/g, '');
      const sNum = String(studentNum || '').replace(/[^0-9]/g, '');
      const sName = (name || '').trim();
      const stGrade = grade || MultiState.activeGrade || '3학년';

      const priorDataG3 = getPriorDataForGrade('3학년');
      const priorDataG2 = getPriorDataForGrade('2학년');
      const matchedG3Modal = (priorDataG3 && Array.isArray(priorDataG3.students)) ? findMatchingPriorStudent(priorDataG3.students, cNum, sNum, sName) : null;
      const matchedG2Modal = (priorDataG2 && Array.isArray(priorDataG2.students)) ? findMatchingPriorStudent(priorDataG2.students, cNum, sNum, sName) : null;
      const matchedCurModal = (AppState.priorData && Array.isArray(AppState.priorData.students)) ? findMatchingPriorStudent(AppState.priorData.students, cNum, sNum, sName) : null;

      let allDetails = [];
      const seenModalKeys = new Set();
      const addModalDetails = (cand) => {
        if (!cand) return;
        if (Array.isArray(cand.courseDetails) && cand.courseDetails.length > 0) {
          cand.courseDetails.forEach(cd => {
            if (!cd || !cd.subject) return;
            const cleanS = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(cd.subject) : cd.subject;
            const isPlacementSem2 = (cd.source === '학생편성현황' || Number(cd.uploadSem) === 2);

            if (isPlacementSem2) {
              const semVal = 2;
              const cKey = `${semVal}::${cleanS}`;
              if (!seenModalKeys.has(cKey)) {
                seenModalKeys.add(cKey);
                allDetails.push({
                  ...cd,
                  subject: cleanS,
                  semester: semVal,
                  uploadSem: semVal,
                  grade: '2학년',
                  source: '학생편성현황'
                });
              }
            } else {
              // 1학기 기이수 과목 (교과학습발달상황): 2학년 1학기 과목만 포함
              if (cd.grade) {
                const gStr = String(cd.grade).trim();
                if (gStr.includes('1') && !gStr.includes('2')) return;
                if (gStr.includes('3') && !gStr.includes('2')) return;
              }
              if (cd.semester !== undefined && cd.semester !== null) {
                const semNum = parseInt(String(cd.semester).replace(/[^0-9]/g, ''), 10);
                if (semNum === 2) return;
              }

              const semVal = 1;
              const cKey = `${semVal}::${cleanS}`;
              if (!seenModalKeys.has(cKey)) {
                seenModalKeys.add(cKey);
                allDetails.push({
                  ...cd,
                  subject: cleanS,
                  semester: semVal,
                  uploadSem: semVal,
                  grade: '2학년',
                  source: '교과학습발달상황'
                });
              }
            }
          });
        } else if (Array.isArray(cand.rawSubjects) && cand.rawSubjects.length > 0) {
          cand.rawSubjects.forEach(rs => {
            let creditVal = _lastPriorSubjectCredit || 4;
            const cm = rs.match(/[\(\[]\s*(\d+(?:\.\d+)?)\s*(?:학점|단위)?[\)\]]/);
            if (cm) creditVal = parseFloat(cm[1]);
            const cleanS = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(rs) : rs.replace(/[\(\[].*?[\)\]]/g, '').trim();
            const cKey = `1::${cleanS}`;
            if (!seenModalKeys.has(cKey)) {
              seenModalKeys.add(cKey);
              allDetails.push({
                subject: cleanS || rs,
                rawSubject: rs,
                normSubject: (typeof normalizeSubject === 'function') ? normalizeSubject(rs) : rs,
                credit: creditVal,
                semester: 1,
                uploadSem: 1,
                grade: '2학년',
                organization: '',
                classroom: '',
                source: '교과학습발달상황'
              });
            }
          });
        }
      };

      if (stGrade === '3학년') {
        addModalDetails(matchedG3Modal);
        addModalDetails(matchedG2Modal);
        addModalDetails(matchedCurModal);
      } else {
        addModalDetails(matchedG2Modal);
        addModalDetails(matchedCurModal);
      }
      const matchedSt = matchedG3Modal || matchedG2Modal || matchedCurModal;

      // 편제표상 '지정' 과목 Set 구축 ('지정' 과목은 기이수 과목 관리 목록에 표시하지 않음!)
      const curriculumAll = (typeof getAllGradesCurriculum === 'function') ? getAllGradesCurriculum() : [];
      const designatedSubjNormSet = new Set();
      curriculumAll.forEach(c => {
        if (c.category === '지정' || c.category === '학교지정') {
          const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(c.subject) : c.subject;
          if (norm) designatedSubjNormSet.add(norm);
        }
      });
      const isDesignated = (s, org, source) => {
        if (!s) return false;
        // 학생편성현황은 편제명(organization)에 '필수이수' 등이 기재될 수 있으므로, 순수 편제표상 학교지정 과목명으로만 판별
        if (source !== '학생편성현황' && org && (org.includes('학교지정') || org === '지정')) return true;
        const norm = (typeof normalizeSubject === 'function') ? normalizeSubject(s) : s;
        return designatedSubjNormSet.has(norm);
      };

      // 기이수 과목 중 '지정' 과목은 화면에 표시하지 않고 보존, '선택' 과목만 편집 목록에 노출
      const visibleElectiveDetails = allDetails.filter(cd => !isDesignated(cd.subject || cd.rawSubject, cd.organization, cd.source));
      const preservedDesignatedDetails = allDetails.filter(cd => isDesignated(cd.subject || cd.rawSubject, cd.organization, cd.source));

      _currentPriorEditingStudent = {
        grade: stGrade,
        classNum: cNum,
        studentNum: sNum,
        name: sName,
        matchedKey: matchedSt ? (matchedSt.key || null) : null,
        courseDetails: visibleElectiveDetails,
        preservedDesignatedDetails: preservedDesignatedDetails
      };

      const badgeEl = document.getElementById('modalPriorStudentBadge');
      if (badgeEl) {
        badgeEl.textContent = `${stGrade} ${cNum}반 ${sNum}번 ${sName}`;
      }

      // 유효 과목 카탈로그 빌드
      buildValidPriorSubjectCatalog();

      // 검색창 및 선택 상태 초기화
      clearPriorSubjectSearch();

      const gradeSel = document.getElementById('modalAddPriorGrade');
      if (gradeSel) {
        gradeSel.value = stGrade === '3학년' ? '2학년' : '1학년';
      }

      const semSel = document.getElementById('modalAddPriorSemester');
      if (semSel) semSel.value = '1';

      const creditInp = document.getElementById('modalAddPriorCredit');
      if (creditInp) creditInp.value = String(_lastPriorSubjectCredit || 4);

      renderModalPriorSubjectsTable();
      filterPriorSubjectSearch(''); // 모달 열릴 때 초기 과목 목록 로드

      const modal = document.getElementById('studentPriorSubjectModal');
      if (modal) modal.classList.remove('hidden');
    }
    window.openStudentPriorSubjectModal = openStudentPriorSubjectModal;

    function closeStudentPriorSubjectModal() {
      const modal = document.getElementById('studentPriorSubjectModal');
      if (modal) modal.classList.add('hidden');
      const ddList = document.getElementById('modalPriorSubjectDropdownList');
      if (ddList) ddList.classList.add('hidden');
      _currentPriorEditingStudent = null;
    }
    window.closeStudentPriorSubjectModal = closeStudentPriorSubjectModal;

    // 전체 시수종합 편제표(getAllGradesCurriculum) 기준 과목 학기 조회 헬퍼
    function getCurriculumSemesterForSubject(subjectName, preferredGrade = '') {
      if (!subjectName) return '-';
      const curriculumAll = (typeof getAllGradesCurriculum === 'function') ? getAllGradesCurriculum() : [];
      if (!curriculumAll || curriculumAll.length === 0) return '-';

      const normSubj = (typeof normalizeSubject === 'function') ? normalizeSubject(subjectName) : subjectName.trim().toLowerCase();
      const baseSubj = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(subjectName) : subjectName.trim();

      // 1순위: 지정된 학년(예: 2학년)에서 매칭되는 과목 탐색
      const matchInGrade = curriculumAll.filter(c => {
        if (preferredGrade && c.grade !== preferredGrade) return false;
        const cNorm = (typeof normalizeSubject === 'function') ? normalizeSubject(c.subject) : (c.subject || '').trim().toLowerCase();
        const cBase = c.baseSubject || ((typeof getBaseSubjectName === 'function') ? getBaseSubjectName(c.subject) : c.subject);
        return cNorm === normSubj || cBase === baseSubj || c.subject === subjectName;
      });

      // 2순위: 전학년 편제표에서 매칭되는 과목 탐색
      const targetList = matchInGrade.length > 0 ? matchInGrade : curriculumAll.filter(c => {
        const cNorm = (typeof normalizeSubject === 'function') ? normalizeSubject(c.subject) : (c.subject || '').trim().toLowerCase();
        const cBase = c.baseSubject || ((typeof getBaseSubjectName === 'function') ? getBaseSubjectName(c.subject) : c.subject);
        return cNorm === normSubj || cBase === baseSubj || c.subject === subjectName;
      });

      if (targetList.length > 0) {
        const sems = new Set(targetList.map(c => parseInt(c.semester, 10)).filter(s => s === 1 || s === 2));
        if (sems.has(1) && sems.has(2)) {
          return '1·2학기';
        } else if (sems.has(1)) {
          return '1학기';
        } else if (sems.has(2)) {
          return '2학기';
        }
      }

      return '-';
    }
    window.getCurriculumSemesterForSubject = getCurriculumSemesterForSubject;

    // 실시간 과목 검색 및 키보드 자동완성 상태 변수
    let _highlightedDropdownIndex = 0;
    let _currentFilteredPriorSubjects = [];

    // 하이라이트 UI 갱신 헬퍼
    function updatePriorDropdownHighlight() {
      const items = document.querySelectorAll('.prior-subj-dropdown-item');
      items.forEach((el, idx) => {
        const badge = el.querySelector('.prior-subj-item-badge');
        if (idx === _highlightedDropdownIndex) {
          el.className = 'prior-subj-dropdown-item px-3 py-2.5 bg-indigo-600 text-white cursor-pointer flex items-center justify-between text-xs transition-colors font-bold shadow-xs';
          if (badge) {
            badge.className = 'prior-subj-item-badge text-[10px] text-indigo-700 font-extrabold bg-white px-2 py-0.5 rounded shadow-2xs';
            badge.textContent = '선택 (Enter)';
          }
          if (typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ block: 'nearest' });
          }
        } else {
          el.className = 'prior-subj-dropdown-item px-3 py-2.5 hover:bg-indigo-50/90 text-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors';
          if (badge) {
            badge.className = 'prior-subj-item-badge text-[10px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded';
            badge.textContent = '선택';
          }
        }
      });
    }

    // 실시간 과목 검색 및 목록 제어 (대형 인라인 전용 패널)
    function filterPriorSubjectSearch(keyword = '') {
      const ddList = document.getElementById('modalPriorSubjectDropdownList');
      const countEl = document.getElementById('modalPriorSearchMatchCount');
      if (!ddList) return;
      ddList.classList.remove('hidden');

      const q = String(keyword || '').trim().toLowerCase();
      const catalog = _validPriorSubjectCatalog && _validPriorSubjectCatalog.length > 0 
        ? _validPriorSubjectCatalog 
        : buildValidPriorSubjectCatalog();

      let matched = [];
      if (!q) {
        matched = catalog.slice(0, 50); // 기본 50개 과목 넉넉하게 표시
      } else {
        matched = catalog.filter(s => s.toLowerCase().includes(q));
      }

      _currentFilteredPriorSubjects = matched;
      _highlightedDropdownIndex = 0; // 항상 첫 번째 항목이 기본 선택되도록 0 초기화

      if (countEl) {
        countEl.textContent = q ? `${matched.length}개 검색됨` : `총 ${catalog.length}개 중 ${matched.length}개 표시`;
      }

      if (matched.length === 0) {
        ddList.innerHTML = '<div class="p-6 text-center text-slate-400 text-xs font-medium">검색 결과가 없습니다.<br><span class="text-[11px] text-slate-400">(편제표 및 사전데이터 내 과목만 선택 가능)</span></div>';
        return;
      }

      ddList.innerHTML = matched.map((s, idx) => {
        let displayHtml = s;
        if (q) {
          const qIdx = s.toLowerCase().indexOf(q);
          if (qIdx !== -1) {
            displayHtml = s.substring(0, qIdx) + '<mark class="bg-indigo-200 text-indigo-900 font-black rounded px-0.5">' + s.substring(qIdx, qIdx + q.length) + '</mark>' + s.substring(qIdx + q.length);
          }
        }
        const isSelected = (idx === 0);
        const itemClass = isSelected
          ? 'prior-subj-dropdown-item px-3 py-2.5 bg-indigo-600 text-white cursor-pointer flex items-center justify-between text-xs transition-colors font-bold shadow-xs'
          : 'prior-subj-dropdown-item px-3 py-2.5 hover:bg-indigo-50/90 text-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors';
        const badgeClass = isSelected
          ? 'prior-subj-item-badge text-[10px] text-indigo-700 font-extrabold bg-white px-2 py-0.5 rounded shadow-2xs'
          : 'prior-subj-item-badge text-[10px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded';
        const badgeText = isSelected ? '선택 (Enter)' : '선택';

        return `
          <div data-index="${idx}" onclick="window.selectPriorSubjectFromList('${s.replace(/'/g, "\\'")}', true)" 
            class="${itemClass}">
            <span class="font-bold text-xs">${displayHtml}</span>
            <span class="${badgeClass}">${badgeText}</span>
          </div>
        `;
      }).join('');

      // 첫 번째 항목을 기본 선택 값으로 hidden input에 동기화
      const hiddenInput = document.getElementById('modalSelectedPriorSubject');
      if (matched.length > 0 && hiddenInput) {
        hiddenInput.value = matched[0];
      }
    }
    window.filterPriorSubjectSearch = filterPriorSubjectSearch;

    // 키보드 방향키(ArrowDown, ArrowUp) 및 엔터(Enter) 내비게이션 핸들러
    function handlePriorSubjectSearchKeydown(e) {
      const list = _currentFilteredPriorSubjects || [];

      if (e.key === 'ArrowDown') {
        if (list.length === 0) return;
        e.preventDefault();
        _highlightedDropdownIndex = (_highlightedDropdownIndex + 1) % list.length;
        updatePriorDropdownHighlight();
        const hiddenInput = document.getElementById('modalSelectedPriorSubject');
        if (hiddenInput && list[_highlightedDropdownIndex]) {
          hiddenInput.value = list[_highlightedDropdownIndex];
        }
      } else if (e.key === 'ArrowUp') {
        if (list.length === 0) return;
        e.preventDefault();
        _highlightedDropdownIndex = (_highlightedDropdownIndex - 1 + list.length) % list.length;
        updatePriorDropdownHighlight();
        const hiddenInput = document.getElementById('modalSelectedPriorSubject');
        if (hiddenInput && list[_highlightedDropdownIndex]) {
          hiddenInput.value = list[_highlightedDropdownIndex];
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (list.length > 0) {
          const selectedSubj = list[_highlightedDropdownIndex] || list[0];
          selectPriorSubjectFromList(selectedSubj, false);
          // 엔터 입력 시 바로 과목 추가 실행!
          handleAddPriorSubjectToModal();
        } else {
          handleAddPriorSubjectToModal();
        }
      } else if (e.key === 'Escape') {
        clearPriorSubjectSearch();
      }
    }
    window.handlePriorSubjectSearchKeydown = handlePriorSubjectSearchKeydown;

    function selectPriorSubjectFromList(subj, autoAdd = false) {
      const searchInput = document.getElementById('modalPriorSubjectSearchInput');
      const hiddenInput = document.getElementById('modalSelectedPriorSubject');

      if (searchInput) searchInput.value = subj;
      if (hiddenInput) hiddenInput.value = subj;

      showSelectedNotice(subj);

      if (autoAdd) {
        handleAddPriorSubjectToModal();
      }
    }
    window.selectPriorSubjectFromList = selectPriorSubjectFromList;

    function showSelectedNotice(subj) {
      const noticeBox = document.getElementById('modalPriorSubjectSelectedNotice');
      const noticeName = document.getElementById('modalPriorSubjectSelectedName');
      if (noticeBox && noticeName) {
        noticeName.textContent = subj;
        noticeBox.classList.remove('hidden');
      }
    }

    function clearPriorSubjectSearch() {
      const searchInput = document.getElementById('modalPriorSubjectSearchInput');
      const hiddenInput = document.getElementById('modalSelectedPriorSubject');
      const noticeBox = document.getElementById('modalPriorSubjectSelectedNotice');

      if (searchInput) searchInput.value = '';
      if (hiddenInput) hiddenInput.value = '';
      if (noticeBox) noticeBox.classList.add('hidden');
      _highlightedDropdownIndex = 0;
      filterPriorSubjectSearch(''); // 검색어 초기화 시 기본 목록 다시 표시
    }
    window.clearPriorSubjectSearch = clearPriorSubjectSearch;

    function renderModalPriorSubjectsTable() {
      if (!_currentPriorEditingStudent) return;
      const list = _currentPriorEditingStudent.courseDetails || [];
      const tbody = document.getElementById('modalPriorSubjectsTbody');
      const emptyEl = document.getElementById('modalPriorSubjectsEmpty');
      const countEl = document.getElementById('modalPriorSubjectsCount');

      if (countEl) countEl.textContent = `총 ${list.length}과목`;

      if (!tbody) return;

      if (list.length === 0) {
        tbody.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
      }

      if (emptyEl) emptyEl.classList.add('hidden');

      tbody.innerHTML = list.map((cd, idx) => {
        let displaySem = '-';
        let semBadgeClass = 'text-indigo-700 bg-indigo-50/70 border-indigo-200';
        const isSem2 = (cd.source === '학생편성현황' || Number(cd.uploadSem) === 2 || Number(cd.semester) === 2);
        const isSem1 = (cd.source === '교과학습발달상황' || Number(cd.uploadSem) === 1 || Number(cd.semester) === 1);

        if (isSem2) {
          displaySem = '2학기 (수강중)';
          semBadgeClass = 'text-emerald-800 bg-emerald-100/90 border-emerald-300';
        } else if (isSem1) {
          displaySem = '1학기 (기이수)';
          semBadgeClass = 'text-sky-800 bg-sky-100/90 border-sky-300';
        } else {
          const currSem = getCurriculumSemesterForSubject(cd.subject || cd.rawSubject, cd.grade);
          displaySem = (currSem && currSem !== '-') ? currSem : (cd.semester ? cd.semester + '학기' : '-');
        }

        return `
          <tr class="hover:bg-indigo-50/40 transition-colors">
            <td class="py-2.5 px-3 text-center font-bold text-slate-700 whitespace-nowrap">${cd.grade || '-'}</td>
            <td class="py-2.5 px-3 text-center font-black whitespace-nowrap">
              <span class="px-2 py-0.5 rounded text-[11px] font-black border ${semBadgeClass}">${displaySem}</span>
            </td>
            <td class="py-2.5 px-3 font-black text-slate-900">
              <div class="flex items-center gap-1.5">
                <span>${cd.subject || cd.rawSubject}</span>
                ${cd.organization ? `<span class="text-[10px] text-slate-400 font-normal">(${cd.organization})</span>` : ''}
              </div>
            </td>
            <td class="py-2.5 px-3 text-center font-black text-slate-700 whitespace-nowrap">${cd.credit ? cd.credit + '학점' : '-'}</td>
            <td class="py-2.5 px-3 text-center whitespace-nowrap">
              <button type="button" onclick="window.handleRemovePriorSubjectFromModal(${idx})" class="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer" title="과목 삭제">
                <svg class="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
    window.renderModalPriorSubjectsTable = renderModalPriorSubjectsTable;

    function handleAddPriorSubjectToModal(silent = false) {
      if (!_currentPriorEditingStudent) return false;

      const searchInput = document.getElementById('modalPriorSubjectSearchInput');
      const hiddenInput = document.getElementById('modalSelectedPriorSubject');
      const gradeSel = document.getElementById('modalAddPriorGrade');
      const semSel = document.getElementById('modalAddPriorSemester');
      const creditInput = document.getElementById('modalAddPriorCredit');

      const inputVal = searchInput ? searchInput.value.trim() : '';
      const selectedVal = hiddenInput ? hiddenInput.value.trim() : '';

      // [목록 내에서만 선택 제한 검증]: 반드시 유효 카탈로그에 존재하는 과목이어야 함!
      const catalog = _validPriorSubjectCatalog && _validPriorSubjectCatalog.length > 0 
        ? _validPriorSubjectCatalog 
        : buildValidPriorSubjectCatalog();

      let targetSubj = '';
      if (selectedVal && catalog.includes(selectedVal)) {
        targetSubj = selectedVal;
      } else if (inputVal) {
        const match = catalog.find(s => s.toLowerCase() === inputVal.toLowerCase());
        if (match) {
          targetSubj = match;
        }
      }

      if (!targetSubj) {
        if (!silent) {
          alert('⚠️ 과목은 목록 내에 존재하는 과목 중에서만 선택해야 합니다.\n\n검색창에 입력 후 나타나는 목록에서 원하는 과목을 선택하거나 Enter 키를 눌러주세요.');
        }
        return false;
      }

      const gradeVal = gradeSel ? gradeSel.value : '2학년';
      let semVal = semSel ? parseInt(semSel.value, 10) : 1;
      const creditVal = creditInput ? parseFloat(creditInput.value) || 4 : 4;

      // 편제표 기준 학기 자동 연동 (편제표에 1학기/2학기 단독 개설 과목인 경우 해당 학기로 자동 정합)
      const currSemInfo = getCurriculumSemesterForSubject(targetSubj, gradeVal);
      if (currSemInfo === '1학기') {
        semVal = 1;
      } else if (currSemInfo === '2학기') {
        semVal = 2;
      }

      _lastPriorSubjectCredit = creditVal;
      try {
        localStorage.setItem('LAST_PRIOR_SUBJECT_CREDIT', String(creditVal));
      } catch (e) {}

      const cleanSubj = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(targetSubj) : targetSubj;
      const normSubj = (typeof normalizeSubject === 'function') ? normalizeSubject(targetSubj) : targetSubj;

      const isDuplicate = (_currentPriorEditingStudent.courseDetails || []).some(cd => {
        return (cd.grade === gradeVal) && (cd.semester === semVal) &&
               ((cd.normSubject && cd.normSubject === normSubj) || (cd.subject === cleanSubj));
      });

      if (isDuplicate) {
        if (!silent) alert(`이미 등록된 과목입니다: [${gradeVal} ${semVal}학기 ${cleanSubj}]`);
        return false;
      }

      _currentPriorEditingStudent.courseDetails.push({
        subject: cleanSubj,
        rawSubject: `${cleanSubj}(${creditVal})`,
        normSubject: normSubj,
        credit: creditVal,
        semester: semVal,
        grade: gradeVal,
        organization: '수동등록',
        classroom: ''
      });

      clearPriorSubjectSearch();
      renderModalPriorSubjectsTable();

      // 추가 후 검색창에 다시 포커스 유지하여 연속 입력 편리성 극대화
      if (searchInput) {
        searchInput.focus();
      }

      return true;
    }
    window.handleAddPriorSubjectToModal = handleAddPriorSubjectToModal;

    function handleRemovePriorSubjectFromModal(idx) {
      if (!_currentPriorEditingStudent || !_currentPriorEditingStudent.courseDetails) return;
      _currentPriorEditingStudent.courseDetails.splice(idx, 1);
      renderModalPriorSubjectsTable();
    }
    window.handleRemovePriorSubjectFromModal = handleRemovePriorSubjectFromModal;

    function handleSaveStudentPriorSubjects() {
      try {
        if (!_currentPriorEditingStudent) {
          closeStudentPriorSubjectModal();
          return;
        }

        // 만약 검색창에 과목이 입력/선택되어 있다면 먼저 자동으로 추가 시도!
        const searchInput = document.getElementById('modalPriorSubjectSearchInput');
        const hiddenInput = document.getElementById('modalSelectedPriorSubject');
        if ((searchInput && searchInput.value.trim()) || (hiddenInput && hiddenInput.value.trim())) {
          handleAddPriorSubjectToModal(true);
        }

        const { grade, classNum, studentNum, name, matchedKey, courseDetails, preservedDesignatedDetails } = _currentPriorEditingStudent;
        const activeG = MultiState.activeGrade || grade || '3학년';
        const studentGrade = (grade === '2학년' || grade === '3학년') ? grade : (activeG === '2학년' ? '2학년' : '3학년');
        const activeYear = MultiState.activeYear || '2027.10.11.';
        const currAY = MultiState.activeAcademicYear || '2027학년도';

        // 최종 전체 과목 목록 = 보존된 지정과목 + 사용자가 편집한 선택과목
        const finalAllDetails = [
          ...(Array.isArray(preservedDesignatedDetails) ? preservedDesignatedDetails : []),
          ...(Array.isArray(courseDetails) ? courseDetails : [])
        ];

        const curAcadData = getAcadData();
        const dateList = Array.from(new Set([
          ...((MultiState.datesByAcademicYear && MultiState.datesByAcademicYear[currAY]) || []),
          ...(MultiState.yearsList || []),
          activeYear
        ].filter(Boolean)));

        // 해당 학생의 소속 학년(studentGrade)에는 반드시 반영하고, 반대 학년은 이미 해당 학생이 사전데이터에 존재하는 경우에만 동기화 (타 학년 오염 원천 차단)
        const targetGrades = Array.from(new Set([studentGrade, '3학년', '2학년']));

        targetGrades.forEach(tGrade => {
          dateList.forEach(d => {
            if (!curAcadData[d]) curAcadData[d] = {};
            if (!curAcadData[d][tGrade]) curAcadData[d][tGrade] = createEmptyGradeState(tGrade);

            // 타 학년(tGrade !== studentGrade)인데 사전데이터가 비어있다면 빈 사전데이터를 새로 만들지 않고 건너뜀
            if (tGrade !== studentGrade && (!curAcadData[d][tGrade].priorData || !Array.isArray(curAcadData[d][tGrade].priorData.students) || curAcadData[d][tGrade].priorData.students.length === 0)) {
              return;
            }

            if (!curAcadData[d][tGrade].priorData) {
              curAcadData[d][tGrade].priorData = {
                fileName: '사전 데이터 (보정 반영)',
                students: [],
                totalRecords: 0,
                courses: [],
                subjects: []
              };
            }
            const pObj = curAcadData[d][tGrade].priorData;
            if (!Array.isArray(pObj.students)) pObj.students = [];

            // pObj.students 원본 배열 안의 진짜 객체를 직접 찾아 갱신 (findMatchingPriorStudent와 동일한 우선순위 보장)
            const cleanName = (name || '').trim();
            let originalSt = null;
            if (matchedKey) {
              originalSt = pObj.students.find(p => p && p.key === matchedKey);
            }
            if (!originalSt) {
              originalSt = pObj.students.find(p => {
                if (!p) return false;
                const pc = String(p.classNum || '').replace(/[^0-9]/g, '') === classNum;
                const pn = String(p.studentNum || '').replace(/[^0-9]/g, '') === studentNum;
                return pc && pn && (p.name || '').trim() === cleanName;
              });
            }
            if (!originalSt) {
              originalSt = pObj.students.find(p => {
                if (!p) return false;
                const pc = String(p.classNum || '').replace(/[^0-9]/g, '') === classNum;
                return pc && (p.name || '').trim() === cleanName;
              });
            }
            if (!originalSt) {
              const nameMatches = pObj.students.filter(p => p && (p.name || '').trim() === cleanName);
              if (nameMatches.length === 1) {
                originalSt = nameMatches[0];
              } else if (nameMatches.length > 1) {
                originalSt = nameMatches.find(p => String(p.studentNum || '').replace(/[^0-9]/g, '') === studentNum) || nameMatches[0];
              }
            }

            // 타 학년(tGrade !== studentGrade)에 해당 학생이 원래 없었다면 타 학년에 학생을 새로 추가하지 않음
            if (!originalSt) {
              if (tGrade !== studentGrade) return;
              originalSt = {
                key: `${classNum}_${studentNum}_${name}`,
                grade: studentGrade,
                classNum,
                studentNum,
                name,
                subjects: [],
                rawSubjects: [],
                courseDetails: []
              };
              pObj.students.push(originalSt);
            }

            // pObj.students 원본 배열 안의 originalSt 객체를 직접 수정!
            originalSt.courseDetails = JSON.parse(JSON.stringify(finalAllDetails));
            originalSt.rawSubjects = finalAllDetails.map(cd => cd.rawSubject || `${cd.subject}(${cd.credit || 4})`);
            originalSt.subjects = Array.from(new Set(finalAllDetails.map(cd => cd.normSubject || (typeof normalizeSubject === 'function' ? normalizeSubject(cd.subject) : cd.subject)).filter(Boolean)));

            // 카탈로그 및 학기별 통계 갱신
            let totalRecords = 0;
            const courseCatMap = new Map();
            pObj.students.forEach(s => {
              if (!s) return;
              (s.courseDetails || []).forEach(cd => {
                if (!cd || !cd.subject) return;
                totalRecords++;
                const catKey = `${cd.grade || '2학년'}::${cd.semester || 1}학기::${cd.subject}`;
                if (!courseCatMap.has(catKey)) {
                  courseCatMap.set(catKey, {
                    key: catKey,
                    subject: cd.subject,
                    rawSubject: cd.rawSubject || `${cd.subject}(${cd.credit || 4})`,
                    grade: cd.grade || '2학년',
                    semester: cd.semester || 1,
                    credit: cd.credit || 4,
                    organization: cd.organization || '수동등록',
                    source: '수동보정'
                  });
                }
              });
            });
            pObj.totalRecords = totalRecords;
            pObj.courses = Array.from(courseCatMap.values());
            pObj.subjects = Array.from(new Set(pObj.courses.map(c => c.subject)));
            if (typeof computePriorSemesterStats === 'function') {
              const semStats = computePriorSemesterStats(pObj);
              pObj.sem1StudentCount = semStats.sem1StCount;
              pObj.sem1RecordCount = semStats.sem1RecCount;
              pObj.sem2StudentCount = semStats.sem2StCount;
              pObj.sem2RecordCount = semStats.sem2RecCount;
            }
            // 이전 교차검증 캐시 무효화 (최신 기이수 과목 기준으로 재계산되도록 보장)
            curAcadData[d][tGrade].crossCheckResult = null;
          });
        });

        // AppState.priorData 즉시 동기화
        if (curAcadData[activeYear]?.[activeG]?.priorData) {
          AppState.priorData = curAcadData[activeYear][activeG].priorData;
        }

        updatePriorDataUI();
        saveAllState();

        // 3단계 선택조건 검증 즉시 재실행 및 화면 결과 테이블 강제 재렌더링
        if (typeof runStep3Validation === 'function') {
          // window._step3LastValidationResult = null;
        }
        if (typeof renderStep3ValidationResults === 'function') {
          renderStep3ValidationResults();
        }

        closeStudentPriorSubjectModal();
        alert(`✅ [${name}] 학생의 기이수 과목이 성공적으로 저장되었습니다!\n선택조건 검증 결과가 즉시 갱신되었습니다.`);
      } catch (err) {
        console.error('handleSaveStudentPriorSubjects error:', err);
        alert('저장 처리 중 오류가 발생했습니다: ' + (err.message || err));
        closeStudentPriorSubjectModal();
      }
    }
    window.handleSaveStudentPriorSubjects = handleSaveStudentPriorSubjects;

    function renderStep3CategoryList() {
      const sData = getStep3Data();
      const categories = sData.categories || [];
      const grid = document.getElementById('step3CategoryCardGrid');
      const emptyState = document.getElementById('step3CategoriesEmptyState');

      if (!grid) return;

      if (categories.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');

      const mappings = sData.mappings || {};
      const catCountMap = {};
      categories.forEach(c => { catCountMap[c.id] = 0; });
      for (const k in mappings) {
        const cId = mappings[k];
        if (catCountMap[cId] !== undefined) catCountMap[cId]++;
      }

      grid.innerHTML = categories.map(cat => {
        const color = STEP3_COLOR_SCHEMES[cat.color] || STEP3_COLOR_SCHEMES.blue;
        const ruleText = formatStep3RuleDesc(cat);
        const mappedCount = catCountMap[cat.id] || 0;

        return `
          <div class="bg-white border ${color.border} rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-3 relative overflow-hidden">
            <div class="h-1.5 w-full ${color.dot} absolute top-0 left-0"></div>

            <div class="flex items-start justify-between gap-2 pt-1">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full ${color.dot} shrink-0"></span>
                <h4 class="text-sm font-black text-slate-800">${cat.name}</h4>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full font-bold ${color.badge}">
                ${mappedCount}과목 매핑됨
              </span>
            </div>

            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div class="text-[11px] font-bold text-slate-500">선택 제한 조건:</div>
              <div class="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                <span>📌 ${ruleText}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600">
              <div class="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-center">
                <span class="text-slate-400 block text-[10px]">적용 대상</span>
                <span>${cat.targetGrade === '전체' ? '2·3학년 전체' : cat.targetGrade}</span>
              </div>
              <div class="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-center">
                <span class="text-slate-400 block text-[10px]">학기 범위</span>
                <span>${cat.targetSemester === '1' ? '1학기만' : (cat.targetSemester === '2' ? '2학기만' : '연간 1·2학기')}</span>
              </div>
            </div>

            <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
              <button type="button" onclick="window.openStep3CategoryModal('${cat.id}')" class="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                ✏️ 수정
              </button>
              <button type="button" onclick="window.deleteStep3Category('${cat.id}')" class="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition">
                🗑️ 삭제
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    function renderStep3SubjectMappingTable() {
      const sData = getStep3Data();
      const categories = sData.categories || [];
      const subjects = getAllCurriculumSubjectsForStep3();

      // 요구사항: '입학생 교육과정' 업로드 파일에 없는 과목은 배정 대기 과목 목록에 배치하기
      if (!sData.manualMappings) sData.manualMappings = {};
      let autoCleaned = false;
      subjects.forEach(cs => {
        const neisInfo = (typeof getSubjectNeisInfo === 'function') ? getSubjectNeisInfo(cs.subject, cs.grade) : null;
        if (!neisInfo) {
          const key = `${cs.grade}::${cs.subject}`;
          // 사용자가 수동으로 이동한 것이 아니라면 배정 대기(미배정) 상태로 유지
          if (!sData.manualMappings[key] && !sData.manualMappings[cs.subject]) {
            if (sData.mappings[key] || sData.mappings[cs.subject]) {
              delete sData.mappings[key];
              delete sData.mappings[cs.subject];
              autoCleaned = true;
            }
          }
        }
      });
      if (autoCleaned) {
        saveStep3Data(sData);
      }

      const curGrade = _step3MappingFilters.grade;
      ['All', '1', '2', '3'].forEach(k => {
        const btn = document.getElementById('step3MapGradeFilter' + k);
        if (!btn) return;
        const targetVal = k === 'All' ? 'all' : (k + '학년');
        if (curGrade === targetVal) {
          btn.className = 'px-2.5 py-1 rounded font-black bg-indigo-600 text-white';
        } else {
          btn.className = 'px-2.5 py-1 rounded font-bold text-slate-600 hover:text-slate-900';
        }
      });

      const catSelect = document.getElementById('step3MapFilterCategory');
      if (catSelect) {
        const curCat = _step3MappingFilters.categoryId;
        let optHtml = '<option value="all">모든 교과군 보기</option><option value="__unmapped__">⚠️ 미지정 과목만 보기</option>';
        categories.forEach(c => {
          optHtml += `<option value="${c.id}" ${curCat === c.id ? 'selected' : ''}>${c.name}</option>`;
        });
        catSelect.innerHTML = optHtml;
      }

      const batchCatSelect = document.getElementById('step3BatchCategorySelect');
      if (batchCatSelect) {
        let bHtml = '<option value="">교과군 선택...</option><option value="__clear__">[미지정으로 해제]</option>';
        categories.forEach(c => {
          bHtml += `<option value="${c.id}">${c.name}</option>`;
        });
        batchCatSelect.innerHTML = bHtml;
      }

      let filtered = subjects.filter(cs => {
        if (_step3MappingFilters.grade !== 'all' && cs.grade !== _step3MappingFilters.grade) return false;

        const assignedCatId = getSubjectCategory(cs.subject, cs.grade);
        if (_step3MappingFilters.categoryId === '__unmapped__' && assignedCatId) return false;
        if (_step3MappingFilters.categoryId !== 'all' && _step3MappingFilters.categoryId !== '__unmapped__' && assignedCatId !== _step3MappingFilters.categoryId) return false;

        if (_step3MappingFilters.search.trim()) {
          const q = _step3MappingFilters.search.trim().toLowerCase();
          const matchSubj = (cs.subject || '').toLowerCase().includes(q);
          const matchTeacher = (cs.teacher || '').toLowerCase().includes(q);
          if (!matchSubj && !matchTeacher) return false;
        }

        return true;
      });

      const tbody = document.getElementById('step3MappingTableBody');
      const selCountEl = document.getElementById('step3SelectedSubjectsCount');
      if (selCountEl) selCountEl.textContent = _step3SelectedSubjectIds.size;

      if (!tbody) return;

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="p-8 text-center text-slate-400 font-bold">조건에 해당하는 과목이 없습니다.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map((cs) => {
        const assignedCatId = getSubjectCategory(cs.subject, cs.grade);
        const assignedCat = assignedCatId ? categories.find(c => c.id === assignedCatId) : null;
        const color = assignedCat ? (STEP3_COLOR_SCHEMES[assignedCat.color] || STEP3_COLOR_SCHEMES.blue) : null;
        const rowId = `${cs.grade}::${cs.subject}`;
        const isChecked = _step3SelectedSubjectIds.has(rowId);

        let selectOptions = '<option value="">-- 미지정 --</option>';
        categories.forEach(c => {
          selectOptions += `<option value="${c.id}" ${assignedCatId === c.id ? 'selected' : ''}>${c.name}</option>`;
        });

        let statusBadge = '';
        if (cs.source === '사전데이터' || cs.status === '사전데이터') {
          statusBadge = '<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200" title="사전 데이터에 업로드된 기이수 개설 과목">사전데이터</span>';
        } else if (cs.status === '폐강') {
          statusBadge = '<span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">폐강</span>';
        } else {
          statusBadge = '<span class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">개설</span>';
        }

        const catSelectorBg = assignedCat ? (color ? color.badge : 'bg-slate-100') : 'bg-slate-100 text-slate-500';

        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-2.5 px-3 text-center">
              <input type="checkbox" onchange="window.toggleStep3SubjectSelect('${rowId}', this.checked)" ${isChecked ? 'checked' : ''} class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
            </td>
            <td class="py-2.5 px-3 text-center font-bold text-slate-700">${cs.grade}</td>
            <td class="py-2.5 px-3 text-center font-bold text-slate-600">${cs.semester}학기</td>
            <td class="py-2.5 px-3 text-center font-medium text-slate-500">${cs.category || '선택'}</td>
            <td class="py-2.5 px-4 font-black text-slate-900">${cs.subject}</td>
            <td class="py-2.5 px-3 text-center font-bold text-slate-600">${cs.hours || 0}</td>
            <td class="py-2.5 px-3 text-center font-bold text-slate-700">${cs.teacher || '-'}</td>
            <td class="py-2.5 px-3 text-center">${statusBadge}</td>
            <td class="py-2.5 px-4">
              <select onchange="window.handleStep3SubjectCategoryChange('${cs.grade}', '${cs.subject}', this.value)" class="text-xs font-bold rounded-lg px-2.5 py-1 border border-slate-300 ${catSelectorBg} focus:ring-2 focus:ring-indigo-400 cursor-pointer">
                ${selectOptions}
              </select>
            </td>
          </tr>
        `;
      }).join('');
    }

    function toggleStep3SubjectSelect(rowId, checked) {
      if (checked) {
        _step3SelectedSubjectIds.add(rowId);
      } else {
        _step3SelectedSubjectIds.delete(rowId);
      }
      const selCountEl = document.getElementById('step3SelectedSubjectsCount');
      if (selCountEl) selCountEl.textContent = _step3SelectedSubjectIds.size;
    }
    window.toggleStep3SubjectSelect = toggleStep3SubjectSelect;

    function toggleStep3SelectAllSubjects(checked) {
      const subjects = getAllCurriculumSubjectsForStep3();
      if (checked) {
        subjects.forEach(cs => {
          _step3SelectedSubjectIds.add(`${cs.grade}::${cs.subject}`);
        });
      } else {
        _step3SelectedSubjectIds.clear();
      }
      renderStep3SubjectMappingTable();
    }
    window.toggleStep3SelectAllSubjects = toggleStep3SelectAllSubjects;

    function handleStep3SubjectCategoryChange(grade, subject, categoryId) {
      const sData = getStep3Data();
      if (!sData.mappings) sData.mappings = {};
      if (!sData.manualMappings) sData.manualMappings = {};

      const key = `${grade}::${subject}`;
      const normSubject = (typeof normalizeSubject === 'function') ? normalizeSubject(subject) : subject.trim();
      const normKey = `${grade}::${normSubject}`;

      if (categoryId) {
        sData.mappings[key] = categoryId;
        sData.mappings[subject] = categoryId;
        sData.mappings[normKey] = categoryId;
        sData.mappings[normSubject] = categoryId;

        sData.manualMappings[key] = true;
        sData.manualMappings[subject] = true;
        sData.manualMappings[normKey] = true;
        sData.manualMappings[normSubject] = true;
      } else {
        delete sData.mappings[key];
        delete sData.mappings[subject];
        delete sData.mappings[normKey];
        delete sData.mappings[normSubject];

        delete sData.manualMappings[key];
        delete sData.manualMappings[subject];
        delete sData.manualMappings[normKey];
        delete sData.manualMappings[normSubject];
      }

      saveStep3Data(sData);
      // window._step3LastValidationResult = null;
      renderStep3SubjectMappingTable();
    }
    window.handleStep3SubjectCategoryChange = handleStep3SubjectCategoryChange;

    function batchAssignStep3Categories() {
      if (_step3SelectedSubjectIds.size === 0) {
        alert('먼저 교과군을 지정할 과목들의 체크박스를 선택해주세요.');
        return;
      }
      const selectEl = document.getElementById('step3BatchCategorySelect');
      const targetCatId = selectEl ? selectEl.value : '';
      if (!targetCatId) {
        alert('일괄 적용할 교과군을 선택해주세요.');
        return;
      }

      const sData = getStep3Data();
      if (!sData.mappings) sData.mappings = {};

      _step3SelectedSubjectIds.forEach(rowId => {
        const parts = rowId.split('::');
        const grade = parts[0];
        const subject = parts[1];
        if (targetCatId === '__clear__') {
          delete sData.mappings[rowId];
          delete sData.mappings[subject];
        } else {
          sData.mappings[rowId] = targetCatId;
          if (!sData.mappings[subject]) {
            sData.mappings[subject] = targetCatId;
          }
        }
      });

      _step3SelectedSubjectIds.clear();
      saveStep3Data(sData);
      // window._step3LastValidationResult = null;
      renderStep3SubjectMappingTable();
      alert('선택한 과목의 교과군이 일괄 적용되었습니다.');
    }
    window.batchAssignStep3Categories = batchAssignStep3Categories;

    function autoAssignStep3CategoriesByName(silent = false) {
      const sData = getStep3Data();
      if (!Array.isArray(sData.categories)) sData.categories = [];
      const categories = sData.categories;

      // 1. 기존 '생활·교양' 명칭을 신규 '생활·교양·기술·가정·정보·제2외국어'로 자동 명칭 마이그레이션
      categories.forEach(c => {
        if (c.name === '생활·교양' || c.name === '생활 교양') {
          c.name = '생활·교양·기술·가정·정보·제2외국어';
        }
      });

      const subjects = getAllCurriculumSubjectsForStep3();

      // 2. 한국사 과목이 존재하는데 한국사 교과군이 없으면 자동으로 한국사 교과군 생성
      let historyCat = categories.find(c => c.name.includes('한국사'));
      if (!historyCat && subjects.some(cs => cs.subject.includes('한국사'))) {
        historyCat = {
          id: 'cat_history_' + Date.now(),
          name: '한국사',
          color: 'rose',
          targetGrade: '전체',
          targetSemester: 'all',
          ruleType: 'min',
          minCount: 1,
          maxCount: 0,
          exactCount: 0
        };
        categories.push(historyCat);
      }

      if (categories.length === 0) {
        if (!silent) alert('교과군이 아직 등록되지 않았습니다. [⚡ 표준 교과군 자동 생성]을 먼저 실행해주세요.');
        return;
      }

      if (!sData.mappings) sData.mappings = {};
      let matchedCount = 0;

      subjects.forEach(cs => {
        const key = `${cs.grade}::${cs.subject}`;
        const curCatId = getSubjectCategory(cs.subject, cs.grade);

        // 3. 회계원리: 미포함 (기존에 배정되어 있었더라도 해제)
        if (cs.subject.includes('회계원리') || cs.subject.includes('회계')) {
          if (sData.mappings[key] || sData.mappings[cs.subject]) {
            delete sData.mappings[key];
            delete sData.mappings[cs.subject];
            matchedCount++;
          }
          return;
        }

        const suggestedCatId = getSuggestedCategoryForSubjectName(cs.subject, categories);

        // 미배정 과목 배정 또는 오분류된 과목 재배정 (예: 스포츠 과학 -> 체육, 전자기와 양자 -> 과학, 한국사 -> 한국사, 인간과 심리 -> 생활교양)
        if (!curCatId && suggestedCatId) {
          sData.mappings[key] = suggestedCatId;
          sData.mappings[cs.subject] = suggestedCatId;
          matchedCount++;
        } else if (curCatId && suggestedCatId && curCatId !== suggestedCatId) {
          sData.mappings[key] = suggestedCatId;
          sData.mappings[cs.subject] = suggestedCatId;
          matchedCount++;
        }
      });

      if (matchedCount > 0) {
        saveStep3Data(sData);
        // window._step3LastValidationResult = null;
        renderStep3SubjectMappingTable();
        if (typeof renderScmModal === 'function') renderScmModal();
        if (typeof renderAllGradesCurriculumTable === 'function') renderAllGradesCurriculumTable();
        if (!silent) alert(`⚡ 총 ${matchedCount}개 과목의 교과군이 최신 규칙(한국사, 생활교양기술정보, 스포츠과학 체육, 전자기양자 과학 등)에 따라 자동 추천/재배정되었습니다!`);
      } else {
        if (!silent) alert('추가로 자동 추천 매칭할 수 있는 과목이 없거나 이미 모두 올바르게 지정되어 있습니다.');
      }
    }
    window.autoAssignStep3CategoriesByName = autoAssignStep3CategoriesByName;

    function getSuggestedCategoryForSubjectName(subjectName, categories) {
      if (!subjectName || !categories || categories.length === 0) return null;
      const s = subjectName.toLowerCase().replace(/\s+/g, '');

      // 0. 회계원리 - 미포함 (절대 자동 배정하지 않음)
      if (s.includes('회계원리') || s.includes('회계')) {
        return null;
      }

      // 1. 한국사 (한국사1, 한국사2, 한국사1-, 한국사2- 등)
      if (s.includes('한국사')) {
        const cat = categories.find(c => c.name.includes('한국사'));
        if (cat) return cat.id;
      }

      // 2. 체육·예술 (스포츠 과학 포함!)
      // '스포츠 과학'은 '과학'이 들어가 있지만 반드시 체육에 포함하도록 최우선 처리!
      const isSportsSci = s.includes('스포츠과학') || (s.includes('스포츠') && s.includes('과학'));
      const peArtKeywords = [
        '체육', '운동', '건강', '스포츠', '육상', '실기',
        '미술', '창작', '음악', '감상', '비평', '연주', '무용', '디자인', '연극'
      ];
      if (isSportsSci || peArtKeywords.some(kw => s.includes(kw))) {
        const cat = categories.find(c => {
          const n = c.name.toLowerCase();
          return n.includes('체육') || n.includes('예술') || n.includes('스포츠') || n.includes('음악') || n.includes('미술');
        });
        if (cat) return cat.id;
      }

      // 3. 탐구 (과학) (전자기와 양자 포함!)
      // 스포츠 관련 과목은 위에서 체육으로 처리되었으므로 과학에서 제외
      const sciKeywords = [
        '전자기와양자', '전자기', '양자', '물리', '역학', '화학', '물질',
        '생명과학', '생물', '지구과학', '융합과학', '과학', '세포', '유전', '행성', '우주'
      ];
      if (sciKeywords.some(kw => s.includes(kw))) {
        let cat = categories.find(c => {
          const n = c.name.toLowerCase();
          return n.includes('과학') && !n.includes('체육');
        });
        if (!cat) {
          cat = categories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes('탐구') && !n.includes('사회');
          });
        }
        if (cat) return cat.id;
      }

      // 4. 생활·교양·기술·가정·정보·제2외국어
      // 진로와직업, 생애설계와자립, 중국어, 일본어, 중국어 회화, 일본어 회화, 인간과 심리 포함!
      const lifeKeywords = [
        '진로와직업', '진로', '직업',
        '생애설계와자립', '생애설계', '자립',
        '중국어', '중국어회화', '중국',
        '일본어', '일본어회화', '일본',
        '인간과심리', '인간과심리', '심리학', '심리',
        '기술', '가정', '기술가정', '기술·가정', '정보', '프로그래밍', '인공지능기초', 'ai기초',
        '한문', '제2외국어', '외국어', '독일어', '프랑스어', '스페인어', '러시아어', '베트남어',
        '보건', '철학', '논술', '환경', '교양'
      ];
      if (lifeKeywords.some(kw => s.includes(kw))) {
        const cat = categories.find(c => {
          const n = c.name.toLowerCase();
          return n.includes('생활') || n.includes('교양') || n.includes('기술') || n.includes('가정') || n.includes('정보') || n.includes('외국어') || n.includes('제2외국어');
        });
        if (cat) return cat.id;
      }

      // 5. 기초 (국어, 수학, 영어)
      const basicKeywords = [
        '국어', '문학', '독서', '화법', '작문', '언어', '매체', '고전',
        '수학', '미적분', '확률', '통계', '기하', '대수', '인공지능수학', '실용수학', '경제수학',
        '영어', '영어회화', '영어독해', '영어작문', '심화영어', '영어권'
      ];
      if (basicKeywords.some(kw => s.includes(kw))) {
        const cat = categories.find(c => {
          const n = c.name.toLowerCase();
          return n.includes('기초') || n.includes('국어') || n.includes('수학') || n.includes('영어');
        });
        if (cat) return cat.id;
      }

      // 6. 탐구 (사회)
      // 한국사는 별도 교과군으로 분리되었고, 인간과 심리는 생활교양에 포함되었으므로 제외
      const socKeywords = [
        '세계사', '동아시아', '역사', '지리', '여행지리', '한국지리', '세계지리',
        '윤리', '사상', '생활과윤리', '현대사회', '정치', '법', '법과사회', '정치와법',
        '경제', '사회문화', '사회'
      ];
      if (socKeywords.some(kw => s.includes(kw))) {
        let cat = categories.find(c => {
          const n = c.name.toLowerCase();
          return (n.includes('사회') || n.includes('역사') || n.includes('지리') || n.includes('도덕')) && !n.includes('과학');
        });
        if (!cat) {
          cat = categories.find(c => {
            const n = c.name.toLowerCase();
            return n.includes('탐구') && !n.includes('과학');
          });
        }
        if (cat) return cat.id;
      }

      return null;
    }

    // Modal Category Management
    window._step3ModalCurColor = 'blue';
    window._step3ModalCurRuleValues = { minCount: 1, maxCount: 4, exactCount: 2 };

    function renderStep3ModalColorPicker(activeColor = 'blue') {
      window._step3ModalCurColor = activeColor;
      const picker = document.getElementById('step3CategoryModalColorPicker');
      if (!picker) return;

      picker.innerHTML = Object.keys(STEP3_COLOR_SCHEMES).map(cKey => {
        const col = STEP3_COLOR_SCHEMES[cKey];
        const isSel = col.key === activeColor;
        return `
          <button type="button" onclick="window.selectStep3ModalColor('${col.key}')" class="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${col.badge} ${isSel ? 'ring-2 ' + col.ring + ' font-black shadow-xs' : 'opacity-70 hover:opacity-100'}">
            <span class="w-2.5 h-2.5 rounded-full ${col.dot}"></span>
            <span>${col.label}</span>
          </button>
        `;
      }).join('');
    }

    function selectStep3ModalColor(cKey) {
      renderStep3ModalColorPicker(cKey);
    }
    window.selectStep3ModalColor = selectStep3ModalColor;

    function openStep3CategoryModal(catId = null) {
      const modal = document.getElementById('step3CategoryModal');
      if (!modal) return;

      const idInput = document.getElementById('step3CategoryModalId');
      const nameInput = document.getElementById('step3CategoryModalName');
      const gradeSelect = document.getElementById('step3CategoryModalGrade');
      const semSelect = document.getElementById('step3CategoryModalSemester');
      const titleEl = document.getElementById('step3CategoryModalTitle');

      const sData = getStep3Data();
      const cat = catId ? (sData.categories || []).find(c => c.id === catId) : null;

      if (idInput) idInput.value = cat ? cat.id : '';
      if (nameInput) nameInput.value = cat ? cat.name : '';
      if (gradeSelect) gradeSelect.value = cat ? cat.targetGrade : '전체';
      if (semSelect) semSelect.value = cat ? cat.targetSemester : 'all';

      if (titleEl) {
        titleEl.innerHTML = cat 
          ? `<span>✏️ 교과군 및 선택 조건 수정: ${cat.name}</span>`
          : `<span>🏷️ 새 교과군 및 선택 조건 등록</span>`;
      }

      renderStep3ModalColorPicker(cat ? cat.color : 'blue');

      const ruleType = cat ? cat.ruleType : 'min';
      const radio = document.querySelector(`input[name="step3CategoryRuleType"][value="${ruleType}"]`);
      if (radio) radio.checked = true;

      window._step3ModalCurRuleValues = {
        minCount: cat ? (cat.minCredits ?? cat.minCount ?? 4) : 4,
        maxCount: cat ? (cat.maxCredits ?? cat.maxCount ?? 12) : 12,
        minCredits: cat ? (cat.minCredits ?? cat.minCount ?? 4) : 4,
        maxCredits: cat ? (cat.maxCredits ?? cat.maxCount ?? 12) : 12
      };

      updateStep3ModalRuleInputs();

      modal.classList.remove('hidden');
      if (nameInput) nameInput.focus();
    }
    window.openStep3CategoryModal = openStep3CategoryModal;

    function closeStep3CategoryModal() {
      const modal = document.getElementById('step3CategoryModal');
      if (modal) modal.classList.add('hidden');
    }
    window.closeStep3CategoryModal = closeStep3CategoryModal;

    function updateStep3ModalRuleInputs() {
      const selectedRadio = document.querySelector('input[name="step3CategoryRuleType"]:checked');
      const rType = selectedRadio ? selectedRadio.value : 'min';
      const container = document.getElementById('step3ModalRuleCountContainer');
      if (!container) return;

      if (rType === 'none') {
        container.innerHTML = `<span class="text-xs font-bold text-slate-500 italic py-1">선택 조건 없음 (학생 자율 선택)</span>`;
      } else if (rType === 'min') {
        container.innerHTML = `
          <span class="text-xs font-bold text-slate-700">최소</span>
          <input type="number" id="step3InputMinCount" value="${window._step3ModalCurRuleValues.minCredits ?? window._step3ModalCurRuleValues.minCount ?? 4}" min="1" max="100" oninput="window.updateStep3ModalSummaryPreview()" class="w-20 text-xs border border-indigo-300 rounded-lg px-2.5 py-1 font-black text-center focus:ring-2 focus:ring-indigo-400">
          <span class="text-xs font-bold text-slate-700">학점 이상</span>
        `;
      } else if (rType === 'max') {
        container.innerHTML = `
          <span class="text-xs font-bold text-slate-700">최대</span>
          <input type="number" id="step3InputMaxCount" value="${window._step3ModalCurRuleValues.maxCredits ?? window._step3ModalCurRuleValues.maxCount ?? 12}" min="1" max="100" oninput="window.updateStep3ModalSummaryPreview()" class="w-20 text-xs border border-indigo-300 rounded-lg px-2.5 py-1 font-black text-center focus:ring-2 focus:ring-indigo-400">
          <span class="text-xs font-bold text-slate-700">학점 이하</span>
        `;
      }

      updateStep3ModalSummaryPreview();
    }
    window.updateStep3ModalRuleInputs = updateStep3ModalRuleInputs;

    function updateStep3ModalSummaryPreview() {
      const selectedRadio = document.querySelector('input[name="step3CategoryRuleType"]:checked');
      const rType = selectedRadio ? selectedRadio.value : 'min';
      const grade = document.getElementById('step3CategoryModalGrade')?.value || '전체';
      const sem = document.getElementById('step3CategoryModalSemester')?.value || 'all';

      const minVal = parseInt(document.getElementById('step3InputMinCount')?.value || 4, 10);
      const maxVal = parseInt(document.getElementById('step3InputMaxCount')?.value || 12, 10);

      window._step3ModalCurRuleValues = { minCount: minVal, maxCount: maxVal, minCredits: minVal, maxCredits: maxVal };

      const dummyCat = {
        targetGrade: grade,
        targetSemester: sem,
        ruleType: rType,
        minCredits: minVal,
        maxCredits: maxVal,
        minCount: minVal,
        maxCount: maxVal
      };

      const previewEl = document.getElementById('step3ModalRuleSummaryPreview');
      if (previewEl) previewEl.textContent = formatStep3RuleDesc(dummyCat);
    }
    window.updateStep3ModalSummaryPreview = updateStep3ModalSummaryPreview;

    function saveStep3CategoryFromModal() {
      const idInput = document.getElementById('step3CategoryModalId');
      const nameInput = document.getElementById('step3CategoryModalName');
      const gradeSelect = document.getElementById('step3CategoryModalGrade');
      const semSelect = document.getElementById('step3CategoryModalSemester');
      const selectedRadio = document.querySelector('input[name="step3CategoryRuleType"]:checked');

      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        alert('교과군 이름을 입력해주세요.');
        if (nameInput) nameInput.focus();
        return;
      }

      const catId = idInput?.value || ('cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4));
      const grade = gradeSelect ? gradeSelect.value : '전체';
      const sem = semSelect ? semSelect.value : 'all';
      const rType = selectedRadio ? selectedRadio.value : 'min';

      const minVal = parseInt(document.getElementById('step3InputMinCount')?.value || 4, 10);
      const maxVal = parseInt(document.getElementById('step3InputMaxCount')?.value || 12, 10);

      const sData = getStep3Data();
      if (!Array.isArray(sData.categories)) sData.categories = [];

      const newCat = {
        id: catId,
        name: name,
        color: window._step3ModalCurColor || 'blue',
        targetGrade: grade,
        targetSemester: sem,
        ruleType: rType,
        minCredits: minVal,
        maxCredits: maxVal,
        minCount: minVal,
        maxCount: maxVal
      };

      const existingIdx = sData.categories.findIndex(c => c.id === catId);
      if (existingIdx >= 0) {
        sData.categories[existingIdx] = newCat;
      } else {
        sData.categories.push(newCat);
      }

      saveStep3Data(sData);
      closeStep3CategoryModal();
      // window._step3LastValidationResult = null;
      renderStep3CategoryList();
      renderStep3SubjectMappingTable();
      if (typeof renderScmModal === 'function') renderScmModal();
      if (typeof renderAllGradesCurriculumTable === 'function') renderAllGradesCurriculumTable();
    }
    window.saveStep3CategoryFromModal = saveStep3CategoryFromModal;

    function deleteStep3Category(catId) {
      if (!confirm('이 교과군을 삭제하시겠습니까?\n(해당 교과군에 매핑된 과목 정보도 함께 해제됩니다.)')) return;

      const sData = getStep3Data();
      sData.categories = (sData.categories || []).filter(c => c.id !== catId);

      if (sData.mappings) {
        for (const k in sData.mappings) {
          if (sData.mappings[k] === catId) {
            delete sData.mappings[k];
          }
        }
      }

      saveStep3Data(sData);
      // window._step3LastValidationResult = null;
      renderStep3CategoryList();
      renderStep3SubjectMappingTable();
      if (typeof renderScmModal === 'function') renderScmModal();
      if (typeof renderAllGradesCurriculumTable === 'function') renderAllGradesCurriculumTable();
    }
    window.deleteStep3Category = deleteStep3Category;

    function generateDefaultStep3Categories() {
      const sData = getStep3Data();
      if (sData.categories && sData.categories.length > 0) {
        if (!confirm('기존 교과군 목록이 있습니다. 표준 교과군(기초, 탐구(사회), 탐구(과학), 체육·예술, 생활·교양·기술·가정·정보·제2외국어, 한국사)을 추가/업데이트하시겠습니까?')) return;
      }

      // 1. 기존 '생활·교양' 명칭을 신규 '생활·교양·기술·가정·정보·제2외국어'로 자동 명칭 마이그레이션
      (sData.categories || []).forEach(c => {
        if (c.name === '생활·교양' || c.name === '생활 교양') {
          c.name = '생활·교양·기술·가정·정보·제2외국어';
        }
      });

      const defaults = createDefaultStep3Categories();
      defaults.forEach(d => {
        if (!sData.categories.some(c => c.name === d.name)) {
          sData.categories.push(d);
        }
      });

      // Set active category to first one if not set
      if (!window._scmActiveCategoryId && sData.categories.length > 0) {
        window._scmActiveCategoryId = sData.categories[0].id;
      }

      saveStep3Data(sData);
      autoAssignStep3CategoriesByName(true); // silent = true
      // window._step3LastValidationResult = null;
      renderStep3CategoryList();
      renderStep3SubjectMappingTable();
      if (typeof renderScmModal === 'function') renderScmModal();
      if (typeof renderAllGradesCurriculumTable === 'function') renderAllGradesCurriculumTable();
      alert('✅ 표준 교과군(기초, 탐구(사회), 탐구(과학), 체육·예술, 생활·교양·기술·가정·정보·제2외국어, 한국사)이 즉시 생성 및 배정되었습니다!');
    }
    window.generateDefaultStep3Categories = generateDefaultStep3Categories;

    function exportStep3ValidationExcel() {
      const lastResult = runStep3Validation(false) || window._step3LastValidationResult;
      if (!lastResult || !lastResult.results || lastResult.results.length === 0) {
        alert('다운로드할 검증 데이터가 없습니다. 먼저 학생 수강신청 엑셀 파일을 업로드해주세요.');
        return;
      }

      const acadYear = (typeof getActiveAcademicYearName === 'function')
        ? getActiveAcademicYearName()
        : (MultiState?.activeAcademicYear || '2027학년도');
      const targetGrade = (_step3ResultFilters.grade && _step3ResultFilters.grade !== 'all') 
        ? _step3ResultFilters.grade 
        : ((MultiState && MultiState.activeGrade !== '전체') ? MultiState.activeGrade : '3학년');

      const sData = getStep3Data();
      const categories = sData.categories || [];
      const wb = XLSX.utils.book_new();

      const fontKo = '맑은 고딕';
      const pastelBorder = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };
      const pastelBorderThick = {
        top: { style: 'medium', color: { rgb: '6366F1' } },
        bottom: { style: 'medium', color: { rgb: '6366F1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      // 텍스트 분량(줄바꿈 및 자동 줄바꿈)에 따른 행 높이 동적 계산 헬퍼 (모든 시트 공용)
      function getVisualWidth(str) {
        let w = 0;
        const s = String(str || '');
        for (let i = 0; i < s.length; i++) {
          w += (s.charCodeAt(i) > 127) ? 1.95 : 1;
        }
        return w;
      }

      function calcWrappedLineCount(text, colWch) {
        if (!text) return 1;
        const usableWch = Math.max(colWch - 3, 8);
        const lines = String(text).split('\n');
        let count = 0;
        lines.forEach(line => {
          const vw = getVisualWidth(line.trim());
          count += vw > 0 ? Math.ceil(vw / usableWch) : 1;
        });
        return Math.max(count, 1);
      }

      // Helper function to build a structured pastel-themed worksheet matching 📋 학생별 교과군 선택 조건 검증 결과 명단
      function buildStructuredValidationSheet(studentList, sheetGradeTitle, subNote = '') {
        const rows = [];
        const merges = [];
        const LAST_COL = 7; // 8개 항목 (0 ~ 7)

        // Title row: exact required format 'nnnn학년도 n학년 1,2학기 학생별 교육과정 점검 결과'
        const mainTitle = `[상지대관령고등학교] ${acadYear} ${sheetGradeTitle} 1,2학기 학생별 교육과정 점검 결과`;
        rows.push([mainTitle]);
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: LAST_COL } });

        // Subtitle row: guidance for homeroom teachers
        const todayStr = new Date().toLocaleDateString('ko-KR');
        const subTitle = subNote || `※ 학급 담임 교사 학생 지도용 안내 자료 | 발행일: ${todayStr} | 상지대관령고등학교 교육과정위원회`;
        rows.push([subTitle]);
        merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: LAST_COL } });

        // Stats summary row
        const totalCnt = studentList.length;
        const passCnt = studentList.filter(s => s.isPass).length;
        const violCnt = studentList.filter(s => s.hasViol).length;
        const dupCnt = studentList.filter(s => s.hasDup).length;
        const needCnt = studentList.filter(s => !s.isPass).length;
        rows.push([`■ 점검 현황: 총 ${totalCnt}명 (이수조건 충족: ${passCnt}명, 점검·지도 대상: ${needCnt}명 [교과군 위반 ${violCnt}명, 중복신청 ${dupCnt}명])`]);
        merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: LAST_COL } });

        // Notice row
        rows.push([`※ 안내: 검증 상태가 '위반' 또는 '중복'인 학생은 해당 사유 및 선택 과목을 확인하여 담임 선생님 지도 및 수강 정정을 진행해주시기 바랍니다.`]);
        merges.push({ s: { r: 3, c: 0 }, e: { r: 3, c: LAST_COL } });

        // Header row: 화면의 '📋 학생별 교과군 선택 조건 검증 결과 명단'과 100% 동일한 항목 구성
        rows.push([
          '학년',
          '반/번호',
          '학생명',
          '검증 상태',
          '위반 교과군 및 불일치 사유',
          '과목 중복 신청',
          '해당 교과군 선택 과목',
          '전체 선택 과목 (1학기 / 2학기)'
        ]);

        // Data rows
        studentList.forEach((st) => {
          // 1) 검증 상태 (위반/중복 줄바꿈 표시)
          let statusText = '정상';
          if (st.hasViol && st.hasDup) {
            statusText = `위반 ${st.violations.length}\n중복 ${st.dupList.length}`;
          } else if (st.hasViol) {
            statusText = `위반 ${st.violations.length}`;
          } else if (st.hasDup) {
            statusText = `중복 ${st.dupList.length}`;
          }

          // 2) 위반 교과군 및 불일치 사유 (🚨1과목 미달 / 🚨n과목 초과 간결 표시)
          let violText = '✅ 모든 교과군 이수 조건 충족';
          if (st.hasViol && st.violations && st.violations.length > 0) {
            violText = st.violations.map(v => {
              const catName = v.category ? v.category.name : '교과군';
              const ruleDesc = v.ruleDesc || '';
              const cleanReason = String(v.reason || '').replace(/^.*\(([^)]+)\)$/, '$1').replace(/^🚨\s*/, '');
              return `${catName}\n${ruleDesc}\n🚨${cleanReason}`;
            }).join('\n\n');
          }

          // 3) 과목 중복 신청 (과목명 (n학기 / 중복 시기))
          let dupText = '-';
          if (st.hasDup && st.dupList && st.dupList.length > 0) {
            dupText = st.dupList.map(d => {
              return `${d.subject} (${d.semester}학기 / ${d.sourceLabel})`;
            }).filter((v, i, a) => a.indexOf(v) === i).join('\n');
          }

          // 4) 해당 교과군 선택 과목 (구체적 과목명 및 사전 기이수 과목)
          let chosenInCatText = '-';
          if (st.hasViol && st.violations && st.violations.length > 0) {
            chosenInCatText = st.violations.map(v => {
              const catName = v.category ? v.category.name : '교과군';
              const totalCnt = (v.allSubjects && v.allSubjects.length > 0) ? v.allSubjects.length : (v.subjects || []).length;
              if (totalCnt === 0) {
                return `[${catName}] 해당 교과군 이수/선택 과목 없음 (0개)`;
              }
              const parts = [];
              if (v.subjects && v.subjects.length > 0) {
                parts.push(`선택 (${v.subjects.length}개): ${v.subjects.join(', ')}`);
              }
              if (v.priorSubjects && v.priorSubjects.length > 0) {
                parts.push(`[기이수] (${v.priorSubjects.length}개): ${v.priorSubjects.join(', ')}`);
              }
              return `[${catName}] 총 인정 ${totalCnt}개 (${parts.join(' / ')})`;
            }).join('\n');
          }

          // 5) 전체 선택 과목 (1학기 / 2학기)
          const sem1Str = (st.sem1 && st.sem1.length > 0) ? st.sem1.join(', ') : '선택 없음';
          const sem2Str = (st.sem2 && st.sem2.length > 0) ? st.sem2.join(', ') : '선택 없음';
          const allCoursesText = `1학기: ${sem1Str}\n2학기: ${sem2Str}`;

          rows.push([
            st.grade,
            `${st.classNum}반 ${st.studentNum}번`,
            st.name,
            statusText,
            violText,
            dupText,
            chosenInCatText,
            allCoursesText
          ]);
        });

        // Summary footer row
        rows.push([
          '합계',
          '',
          `총 ${totalCnt}명`,
          `정상 ${passCnt}명 / 점검 ${needCnt}명`,
          `위반 ${violCnt}명`,
          `중복 ${dupCnt}명`,
          '',
          ''
        ]);
        const sumRowIdx = rows.length - 1;
        merges.push({ s: { r: sumRowIdx, c: 0 }, e: { r: sumRowIdx, c: 1 } });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!merges'] = merges;

        // Column widths (8개 항목)
        const colWidths = [
          { wch: 9 },  // 0: 학년
          { wch: 12 }, // 1: 반/번호
          { wch: 12 }, // 2: 학생명
          { wch: 13 }, // 3: 검증 상태
          { wch: 38 }, // 4: 위반 교과군 및 불일치 사유
          { wch: 34 }, // 5: 과목 중복 신청
          { wch: 38 }, // 6: 해당 교과군 선택 과목 (구체적 과목명)
          { wch: 46 }  // 7: 전체 선택 과목 (1학기 / 2학기)
        ];
        ws['!cols'] = colWidths;

        // Row heights (모든 시트의 각 행마다 텍스트 분량에 맞춰 자동 조절)
        const rowHeights = [
          { hpt: 34 }, // Title
          { hpt: 20 }, // Subtitle
          { hpt: 22 }, // Stats
          { hpt: 20 }, // Notice
          { hpt: 28 }  // Table header
        ];
        for (let i = 0; i < studentList.length; i++) {
          const dataRow = rows[5 + i] || [];
          const linesStatus = calcWrappedLineCount(dataRow[3], colWidths[3].wch);
          const linesViol   = calcWrappedLineCount(dataRow[4], colWidths[4].wch);
          const linesDup    = calcWrappedLineCount(dataRow[5], colWidths[5].wch);
          const linesChosen = calcWrappedLineCount(dataRow[6], colWidths[6].wch);
          const linesAll    = calcWrappedLineCount(dataRow[7], colWidths[7].wch);
          const maxLines = Math.max(1, linesStatus, linesViol, linesDup, linesChosen, linesAll);
          const dynamicHpt = Math.max(28, maxLines * 16 + 12);
          rowHeights.push({ hpt: dynamicHpt });
        }
        rowHeights.push({ hpt: 26 }); // Footer
        ws['!rows'] = rowHeights;

        // Page setup for printing: A4 Landscape, Fit to 1 page wide
        ws['!pageSetup'] = {
          paperSize: 9,            // A4
          orientation: 'landscape', // 가로 방향
          fitToWidth: 1,
          fitToPage: true
        };
        ws['!printOptions'] = { horizontalCentered: true };
        ws['!margins'] = { left: 0.35, right: 0.35, top: 0.45, bottom: 0.45, header: 0.2, footer: 0.2 };

        // Apply Pastel Styles
        // Title (Row 0)
        for (let c = 0; c <= LAST_COL; c++) {
          const ref = XLSX.utils.encode_cell({ r: 0, c });
          if (!ws[ref]) ws[ref] = { t: 's', v: '' };
          ws[ref].s = {
            font: { name: fontKo, sz: 14, bold: true, color: { rgb: '1E293B' } },
            fill: { fgColor: { rgb: 'EEF2FF' } }, // Pastel soft indigo
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: '6366F1' } },
              bottom: { style: 'thin', color: { rgb: 'C7D2FE' } },
              left: { style: 'medium', color: { rgb: '6366F1' } },
              right: { style: 'medium', color: { rgb: '6366F1' } }
            }
          };
        }

        // Subtitle (Row 1)
        for (let c = 0; c <= LAST_COL; c++) {
          const ref = XLSX.utils.encode_cell({ r: 1, c });
          if (!ws[ref]) ws[ref] = { t: 's', v: '' };
          ws[ref].s = {
            font: { name: fontKo, sz: 9, color: { rgb: '64748B' } },
            fill: { fgColor: { rgb: 'F8FAFC' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              left: { style: 'medium', color: { rgb: '6366F1' } },
              right: { style: 'medium', color: { rgb: '6366F1' } },
              bottom: { style: 'thin', color: { rgb: 'E2E8F0' } }
            }
          };
        }

        // Stats (Row 2)
        for (let c = 0; c <= LAST_COL; c++) {
          const ref = XLSX.utils.encode_cell({ r: 2, c });
          if (!ws[ref]) ws[ref] = { t: 's', v: '' };
          ws[ref].s = {
            font: { name: fontKo, sz: 9.5, bold: true, color: { rgb: '334155' } },
            fill: { fgColor: { rgb: 'F1F5F9' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              left: { style: 'medium', color: { rgb: '6366F1' } },
              right: { style: 'medium', color: { rgb: '6366F1' } },
              bottom: { style: 'thin', color: { rgb: 'E2E8F0' } }
            }
          };
        }

        // Notice (Row 3)
        for (let c = 0; c <= LAST_COL; c++) {
          const ref = XLSX.utils.encode_cell({ r: 3, c });
          if (!ws[ref]) ws[ref] = { t: 's', v: '' };
          ws[ref].s = {
            font: { name: fontKo, sz: 8.5, color: { rgb: '94A3B8' }, italic: true },
            fill: { fgColor: { rgb: 'F8FAFC' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              left: { style: 'medium', color: { rgb: '6366F1' } },
              right: { style: 'medium', color: { rgb: '6366F1' } },
              bottom: { style: 'medium', color: { rgb: '94A3B8' } }
            }
          };
        }

        // Header (Row 4)
        for (let c = 0; c <= LAST_COL; c++) {
          const ref = XLSX.utils.encode_cell({ r: 4, c });
          if (!ws[ref]) ws[ref] = { t: 's', v: '' };
          ws[ref].s = {
            font: { name: fontKo, sz: 10, bold: true, color: { rgb: '1E293B' } },
            fill: { fgColor: { rgb: 'E0E7FF' } }, // Pastel lavender/indigo header
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: pastelBorderThick
          };
        }

        // Data Rows (Row 5 to 5 + studentList.length - 1)
        studentList.forEach((st, idx) => {
          const r = 5 + idx;
          const isEven = (idx % 2 === 0);

          let rowBg = isEven ? 'FFFFFF' : 'F8FAFC';
          let statusColor = '059669'; // Emerald
          let statusBg = isEven ? 'F0FDF4' : 'DCFCE7';

          if (st.hasViol && st.hasDup) {
            rowBg = isEven ? 'FFF1F2' : 'FFE4E6'; // Pastel pink/rose
            statusColor = '9F1239';
            statusBg = 'FECDD3';
          } else if (st.hasViol) {
            rowBg = isEven ? 'FFF1F2' : 'FFE4E6'; // Pastel rose
            statusColor = 'BE123C';
            statusBg = 'FFE4E6';
          } else if (st.hasDup) {
            rowBg = isEven ? 'FFFBEB' : 'FEF3C7'; // Pastel amber
            statusColor = 'B45309';
            statusBg = 'FEF3C7';
          }

          for (let c = 0; c <= LAST_COL; c++) {
            const ref = XLSX.utils.encode_cell({ r, c });
            if (!ws[ref]) ws[ref] = { t: 's', v: '' };

            const isCenterCol = [0, 1, 2, 3].includes(c);
            let cellFont = { name: fontKo, sz: 9.5, color: { rgb: '334155' } };
            let cellBg = rowBg;

            if (c === 2) { // 학생명
              cellFont = { name: fontKo, sz: 10, bold: true, color: { rgb: '0F172A' } };
            } else if (c === 3) { // 검증 상태
              cellFont = { name: fontKo, sz: 9.5, bold: true, color: { rgb: statusColor } };
              cellBg = statusBg;
            } else if (c === 4 && st.hasViol) { // 위반 교과군 및 불일치 사유
              cellFont = { name: fontKo, sz: 9, bold: true, color: { rgb: '9F1239' } };
            } else if (c === 5 && st.hasDup) { // 과목 중복 신청
              cellFont = { name: fontKo, sz: 9, bold: true, color: { rgb: 'B45309' } };
            } else if (c === 6 && st.hasViol) { // 해당 교과군 선택 과목
              cellFont = { name: fontKo, sz: 9, color: { rgb: '1E293B' } };
            }

            ws[ref].s = {
              font: cellFont,
              fill: { fgColor: { rgb: cellBg } },
              alignment: {
                horizontal: isCenterCol ? 'center' : 'left',
                vertical: 'center',
                wrapText: !isCenterCol || c === 3
              },
              border: pastelBorder
            };
          }
        });

        // Summary footer (sumRowIdx)
        for (let c = 0; c <= LAST_COL; c++) {
          const ref = XLSX.utils.encode_cell({ r: sumRowIdx, c });
          if (!ws[ref]) ws[ref] = { t: 's', v: '' };
          ws[ref].s = {
            font: { name: fontKo, sz: 9.5, bold: true, color: { rgb: '1E293B' } },
            fill: { fgColor: { rgb: 'E2E8F0' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: pastelBorderThick
          };
        }

        return ws;
      }

      // Filter target students by selected grade (or all if 'all')
      const targetGradeStudents = (targetGrade === 'all')
        ? lastResult.results
        : lastResult.results.filter(st => st.grade === targetGrade);

      const displayGradeTitle = (targetGrade === 'all') ? '2·3학년' : targetGrade;

      // Sheet 1: Total grade sheet
      const wsMain = buildStructuredValidationSheet(targetGradeStudents, `${displayGradeTitle} 전체`);
      XLSX.utils.book_append_sheet(wb, wsMain, `${displayGradeTitle}_전체_점검결과`.substring(0, 31));

      // Sheets 2..N: Per-class sheets for homeroom teachers
      const classMap = {};
      targetGradeStudents.forEach(st => {
        const cls = String(st.classNum || '1');
        if (!classMap[cls]) classMap[cls] = [];
        classMap[cls].push(st);
      });

      const sortedClassKeys = Object.keys(classMap).sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0));
      sortedClassKeys.forEach(cls => {
        const classStudents = classMap[cls];
        const classSheetTitle = `${displayGradeTitle} ${cls}반`;
        const classSubNote = `※ ${displayGradeTitle} ${cls}반 담임 선생님 지도용 안내 자료 | 발행일: ${new Date().toLocaleDateString('ko-KR')} | 학생 확인 후 지도 바랍니다.`;
        const wsClass = buildStructuredValidationSheet(classStudents, classSheetTitle, classSubNote);
        XLSX.utils.book_append_sheet(wb, wsClass, `${displayGradeTitle}_${cls}반`.substring(0, 31));
      });

      // Sheet N+1: Students needing guidance (violations or duplicates)
      const needGuidanceList = targetGradeStudents.filter(st => !st.isPass);
      if (needGuidanceList.length > 0) {
        const guidanceTitle = `${displayGradeTitle} 지도대상자(위반·중복)`;
        const guidanceNote = `※ 교과군 이수조건 위반 및 동일·기이수 중복 신청 학생 명단 (총 ${needGuidanceList.length}명 집중 점검 지도용)`;
        const wsGuidance = buildStructuredValidationSheet(needGuidanceList, guidanceTitle, guidanceNote);
        XLSX.utils.book_append_sheet(wb, wsGuidance, '지도대상_학생명단(위반·중복)');
      }

      // Sheet N+2: Category standards reference table (교과군별_과목_지정기준 탭도 동일하게 행 높이 및 스타일 적용)
      const sRefData = [];
      sRefData.push([`[상지대관령고등학교] ${acadYear} 교육과정 과목별 교과군 지정 기준표`]);
      sRefData.push([`등록 교과군: ${categories.length}개 군 | 매핑 과목 수: ${Object.keys(sData.mappings || {}).length}개 | 출력일: ${new Date().toLocaleDateString('ko-KR')}`]);
      sRefData.push(['학년', '학기', '구분', '과목명', '배정 교과군', '교과군 조건', '단위(시수)', '담당교사', '개설상태']);

      const currSubjects = getAllCurriculumSubjectsForStep3();
      currSubjects.forEach(cs => {
        const catId = getSubjectCategory(cs.subject, cs.grade);
        const cat = catId ? categories.find(c => c.id === catId) : null;
        sRefData.push([
          cs.grade,
          cs.semester + '학기',
          cs.category || '선택',
          cs.subject,
          cat ? cat.name : '미지정',
          cat ? formatStep3RuleDesc(cat) : '-',
          cs.hours || 0,
          cs.teacher || '',
          cs.status || '개설'
        ]);
      });

      const wsRef = XLSX.utils.aoa_to_sheet(sRefData);
      wsRef['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }
      ];
      const refColWidths = [
        { wch: 9 }, { wch: 9 }, { wch: 10 }, { wch: 24 }, { wch: 28 }, { wch: 32 }, { wch: 11 }, { wch: 16 }, { wch: 11 }
      ];
      wsRef['!cols'] = refColWidths;

      const refRowHeights = [
        { hpt: 32 }, // Title
        { hpt: 20 }, // Subtitle
        { hpt: 26 }  // Header
      ];
      for (let r = 3; r < sRefData.length; r++) {
        const rowArr = sRefData[r] || [];
        let maxL = 1;
        for (let c = 0; c <= 8; c++) {
          maxL = Math.max(maxL, calcWrappedLineCount(rowArr[c], refColWidths[c].wch));
        }
        refRowHeights.push({ hpt: Math.max(24, maxL * 15 + 8) });
      }
      wsRef['!rows'] = refRowHeights;

      for (let r = 0; r < sRefData.length; r++) {
        for (let c = 0; c <= 8; c++) {
          const ref = XLSX.utils.encode_cell({ r, c });
          if (!wsRef[ref]) wsRef[ref] = { t: 's', v: '' };
          if (r === 0) {
            wsRef[ref].s = {
              font: { name: fontKo, sz: 13, bold: true, color: { rgb: '1E293B' } },
              fill: { fgColor: { rgb: 'EEF2FF' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: pastelBorderThick
            };
          } else if (r === 1) {
            wsRef[ref].s = {
              font: { name: fontKo, sz: 9, color: { rgb: '64748B' } },
              fill: { fgColor: { rgb: 'F8FAFC' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: pastelBorder
            };
          } else if (r === 2) {
            wsRef[ref].s = {
              font: { name: fontKo, sz: 10, bold: true, color: { rgb: '1E293B' } },
              fill: { fgColor: { rgb: 'E0E7FF' } },
              alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
              border: pastelBorderThick
            };
          } else {
            const isEven = (r % 2 === 1);
            const isCenter = [0, 1, 2, 6, 7, 8].includes(c);
            wsRef[ref].s = {
              font: { name: fontKo, sz: 9.5, color: { rgb: '334155' } },
              fill: { fgColor: { rgb: isEven ? 'FFFFFF' : 'F8FAFC' } },
              alignment: { horizontal: isCenter ? 'center' : 'left', vertical: 'center', wrapText: true },
              border: pastelBorder
            };
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, wsRef, '교과군별_과목_지정기준');

      const fileName = (typeof buildExportFileName === 'function') 
        ? buildExportFileName(`${displayGradeTitle}_1,2학기_학생별_교육과정_점검결과`, 'xlsx')
        : `${acadYear} ${displayGradeTitle}_1,2학기_학생별_교육과정_점검결과.xlsx`;

      if (typeof window.saveExcelFile === 'function') {
        window.saveExcelFile(wb, fileName);
      } else {
        XLSX.writeFile(wb, fileName);
      }
    }
    window.exportStep3ValidationExcel = exportStep3ValidationExcel;

    // =========================================================================
    // 3단계 메인 탭 전환 컨트롤러 (교과군 선택조건 검증 vs 학기별 이수학점 점검)
    // =========================================================================
    window._step3ActiveMainTab = 'category';

    function switchStep3MainTab(tab) {
      if (tab === 'creditAudit') {
        if (typeof window.loadCreditAuditHeaderConfig === 'function') window.loadCreditAuditHeaderConfig();
        if (typeof window.initCreditAuditDropZone === 'function') window.initCreditAuditDropZone();
        window.loadCreditAuditHeaderConfig();
      }
      window._step3ActiveMainTab = tab;
      const btnCat = document.getElementById('step3MainTabBtnCategory');
      const btnAudit = document.getElementById('step3MainTabBtnCreditAudit');
      const viewCat = document.getElementById('step3MainTabViewCategory');
      const viewAudit = document.getElementById('step3MainTabViewCreditAudit');

      const activeClasses = ['bg-gradient-to-r', 'from-purple-600', 'to-indigo-700', 'text-white', 'shadow-md', 'ring-2', 'ring-purple-300'];
      const inactiveClasses = ['bg-white', 'hover:bg-slate-100', 'text-slate-700', 'border', 'border-slate-300', 'shadow-2xs'];

      if (tab === 'category') {
        if (btnCat) {
          btnCat.classList.remove(...inactiveClasses);
          btnCat.classList.add(...activeClasses);
        }
        if (btnAudit) {
          btnAudit.classList.remove(...activeClasses);
          btnAudit.classList.add(...inactiveClasses);
        }
        if (viewCat) viewCat.classList.remove('hidden');
        if (viewAudit) viewAudit.classList.add('hidden');
      } else {
        if (btnAudit) {
          btnAudit.classList.remove(...inactiveClasses);
          btnAudit.classList.add(...activeClasses);
        }
        if (btnCat) {
          btnCat.classList.remove(...activeClasses);
          btnCat.classList.add(...inactiveClasses);
        }
        if (viewAudit) viewAudit.classList.remove('hidden');
        if (viewCat) viewCat.classList.add('hidden');

        // 학기별 점검 탭 진입: 사용자 요청에 따라 업로드/탭 진입 시 자동 실행하지 않고, [점검] 버튼 클릭 시 수동 실행
        if (window._creditAuditStudents && window._creditAuditStudents.length > 0) {
          renderCreditAuditTable();
        }
      }
    }
    window.switchStep3MainTab = switchStep3MainTab;

    // =========================================================================
    // 학기별 이수학점 점검 시스템 (Credit Audit System) 컨트롤러
    // =========================================================================
    window._creditAuditStudents = [];
    window._creditAuditFilter = 'all';

    function getCreditAuditRequired() {
      return {
        '1-1': parseInt(document.getElementById('caCredit-1-1')?.value || 29, 10),
        '1-2': parseInt(document.getElementById('caCredit-1-2')?.value || 29, 10),
        '2-1': parseInt(document.getElementById('caCredit-2-1')?.value || 29, 10),
        '2-2': parseInt(document.getElementById('caCredit-2-2')?.value || 29, 10),
        '3-1': parseInt(document.getElementById('caCredit-3-1')?.value || 29, 10),
        '3-2': parseInt(document.getElementById('caCredit-3-2')?.value || 29, 10)
      };
    }

    function resetCreditAuditDefaults() {
      ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'].forEach(k => {
        const inp = document.getElementById('caCredit-' + k);
        if (inp) inp.value = '29';
      });
      recalculateCreditAudit();
    }
    window.resetCreditAuditDefaults = resetCreditAuditDefaults;

    function recalculateCreditAudit() {
      const req = getCreditAuditRequired();
      ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'].forEach(k => {
        const th = document.getElementById('caTh-' + k);
        if (th) th.textContent = `(기준 ${req[k]})`;
      });
      renderCreditAuditTable();
    }
    window.recalculateCreditAudit = recalculateCreditAudit;

    // 1. 현재 시스템 데이터(1단계 1·2학년 교과학습발달상황 + 수강신청 조사)에서 학기별 이수학점 자동 분석
    function runCreditAuditFromCurrentSystem(targetGrade = null) {
      const { grade2Students, grade3Students } = getStep3StudentsData();
      const priorDataG2 = getPriorDataForGrade('2학년');
      const priorDataG3 = getPriorDataForGrade('3학년');
      const curriculumAll = (typeof getAllGradesCurriculum === 'function') ? getAllGradesCurriculum() : [];

      const creditMap = new Map();
      curriculumAll.forEach(c => {
        if (c.subject) creditMap.set(c.subject, Number(c.hours) || 4);
      });

      const studentMap = new Map();

      const registerStudent = (st, defaultGrade) => {
        if (!st || !st.name) return null;
        const grade = st.grade || defaultGrade || '2학년';
        const cNum = String(st.classNum || '1').replace(/[^0-9]/g, '');
        const sNum = String(st.studentNum || '01').replace(/[^0-9]/g, '');
        const sName = (st.name || '').trim();
        const key = `${grade}::${cNum}::${sNum}::${sName}`;

        if (!studentMap.has(key)) {
          studentMap.set(key, {
            id: st.id || ('ca_' + key),
            grade: grade,
            classNum: cNum || '1',
            studentNum: sNum || '01',
            studentIdStr: `${cNum}-${sNum.padStart(2, '0')}`,
            name: sName,
            sem1: Array.isArray(st.sem1) ? [...st.sem1] : [],
            sem2: Array.isArray(st.sem2) ? [...st.sem2] : [],
            credits: { '1-1': 0, '1-2': 0, '2-1': 0, '2-2': 0, '3-1': 0, '3-2': 0 },
            seenCourses: new Set()
          });
        }
        return studentMap.get(key);
      };

      // 1) 수강신청 조사 및 1단계 교과학습발달상황 학생 등록 (학년별 선택 실행 지원)
      const allowG2 = !targetGrade || targetGrade === 'all' || targetGrade === '2학년';
      const allowG3 = !targetGrade || targetGrade === 'all' || targetGrade === '3학년';

      if (allowG2) {
        grade2Students.forEach(st => registerStudent(st, '2학년'));
        if (priorDataG2 && Array.isArray(priorDataG2.students)) {
          priorDataG2.students.forEach(st => registerStudent(st, '2학년'));
        }
        if (MultiState.activeGrade === '2학년' && AppState.students && Array.isArray(AppState.students)) {
          AppState.students.forEach(st => registerStudent(st, '2학년'));
        }
      }

      if (allowG3) {
        grade3Students.forEach(st => registerStudent(st, '3학년'));
        if (priorDataG3 && Array.isArray(priorDataG3.students)) {
          priorDataG3.students.forEach(st => registerStudent(st, '3학년'));
        }
        if (MultiState.activeGrade === '3학년' && AppState.students && Array.isArray(AppState.students)) {
          AppState.students.forEach(st => registerStudent(st, '3학년'));
        }
      }

      // 학생별 1단계 교과학습발달상황(1학년, 2학년) 기이수 학점 및 수강신청 조사 학점 정밀 집계
      studentMap.forEach(stObj => {
        const cNum = stObj.classNum;
        const sNum = stObj.studentNum;
        const sName = stObj.name;
        const sGrade = stObj.grade;

        // 사전 데이터(교과학습발달상황) 매칭
        let priorSt = null;
        if (sGrade === '2학년') {
          if (priorDataG2?.students) priorSt = findMatchingPriorStudent(priorDataG2.students, cNum, sNum, sName);
        } else {
          if (priorDataG3?.students) priorSt = findMatchingPriorStudent(priorDataG3.students, cNum, sNum, sName);
          if (!priorSt && priorDataG2?.students) priorSt = findMatchingPriorStudent(priorDataG2.students, cNum, sNum, sName);
        }
        if (!priorSt && AppState.priorData?.students) {
          priorSt = findMatchingPriorStudent(AppState.priorData.students, cNum, sNum, sName);
        }

        // [핵심] 1단계에서 입력한 1학년과 2학년의 교과학습발달상황 그대로 가져오기
        if (priorSt && Array.isArray(priorSt.courseDetails)) {
          priorSt.courseDetails.forEach(cd => {
            if (!cd || !cd.subject) return;
            const cleanSubj = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(cd.subject) : cd.subject;
            
            let semKey = '';

            if (sGrade === '2학년') {
              // 현 1학년 (시스템상 '2학년'):
              // 사용자 요구사항: 현 1학년은 생활기록부에 1학년 1학기('1-1') 정보만 존재하므로 무조건 '1-1'로 매핑!
              semKey = '1-1';
            } else {
              // 현 2학년 (시스템상 '3학년'):
              // 사용자 요구사항: 교과학습발달상황에는 1-1, 1-2, 2-1만 존재하며, 2-2는 존재하지 않음!
              const isGrade1 = cd.grade && String(cd.grade).includes('1');
              if (isGrade1) {
                // 1학년 과목: 1학기 / 2학기 정밀 판별 (연도 '2026'의 2와 혼동 방지)
                const semRawStr = String(cd.semester || cd.uploadSem || '').trim();
                const isSem2 = /2\s*학기|(?:^|[^\d])2(?:$|[^\d])/.test(semRawStr) || cd.uploadSem === 2;
                semKey = isSem2 ? '1-2' : '1-1';
              } else {
                // 2학년 과목:
                // 교과학습발달상황의 2학년 과목은 현재 2학년 1학기('2-1')만 이수한 상태이므로 기본 '2-1'!
                // 단, 사용자가 명시적으로 '학생편성현황'(2학기 수강 슬롯)을 업로드한 경우에만 '2-2'로 인정
                const isExplicitSem2Placement = (cd.source === '학생편성현황');
                semKey = isExplicitSem2Placement ? '2-2' : '2-1';
              }
            }

            const courseKey = `${semKey}::${cleanSubj}`;
            if (!stObj.seenCourses.has(courseKey)) {
              stObj.seenCourses.add(courseKey);
              const gNum = semKey.split('-')[0];
              const cr = parseFloat(cd.credit) || (typeof getStep3SubjectCredit === 'function' ? getStep3SubjectCredit(cleanSubj, `${gNum}학년`) : (creditMap.get(cleanSubj) || 4));
              if (stObj.credits[semKey] !== undefined) {
                stObj.credits[semKey] += cr;
              }
            }
          });
        }

        // [요구사항 반영]: 학기별 이수학점 점검은 1단계에서 업로드한 1·2학년의 교과학습발달상황 순수 기이수 학점만 점검하며,
        // 아직 진행되지 않은 미래 학기의 수강신청 조사 과목 및 편제표 과목은 합산하지 않습니다.
      });

      const auditList = Array.from(studentMap.values()).sort((a, b) => {
        if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
        const cA = parseInt(a.classNum, 10) || 0;
        const cB = parseInt(b.classNum, 10) || 0;
        if (cA !== cB) return cA - cB;
        const sA = parseInt(a.studentNum, 10) || 0;
        const sB = parseInt(b.studentNum, 10) || 0;
        if (sA !== sB) return sA - sB;
        return a.name.localeCompare(b.name, 'ko');
      });

      window._creditAuditStudents = auditList;
      renderCreditAuditTable();
    }
    window.runCreditAuditFromCurrentSystem = runCreditAuditFromCurrentSystem;
    // 학년별 이수학점 점검 명시적 실행 함수
    function runCreditAuditForGrade(targetGrade = 'all') {
      window._creditAuditGradeFilter = targetGrade;
      runCreditAuditFromCurrentSystem(targetGrade);
    }
    window.runCreditAuditForGrade = runCreditAuditForGrade;


    // 1-2. 엑셀 필수 열 제목 사용자 설정 및 유연한 매칭 로직
    const DEFAULT_CA_HEADER_CONFIG = {
      name: '성명, 이름, 학생명',
      grade: '학년',
      semester: '학기',
      credit: '단위수, 단위, 학점, 시수, 이수학점, 이수단위',
      class: '반, 학급',
      number: '번호',
      subject: '과목명, 교과목, 과목'
    };

    function loadCreditAuditHeaderConfig() {
      try {
        const saved = localStorage.getItem('ca_custom_header_config');
        const cfg = saved ? JSON.parse(saved) : DEFAULT_CA_HEADER_CONFIG;
        const setVal = (id, val) => {
          const el = document.getElementById(id);
          if (el && val !== undefined) el.value = val;
        };
        setVal('caColName', cfg.name || DEFAULT_CA_HEADER_CONFIG.name);
        setVal('caColGrade', cfg.grade || DEFAULT_CA_HEADER_CONFIG.grade);
        setVal('caColSemester', cfg.semester || DEFAULT_CA_HEADER_CONFIG.semester);
        setVal('caColCredit', cfg.credit || DEFAULT_CA_HEADER_CONFIG.credit);
        setVal('caColClass', cfg.class || DEFAULT_CA_HEADER_CONFIG.class);
        setVal('caColNumber', cfg.number || DEFAULT_CA_HEADER_CONFIG.number);
        setVal('caColSubject', cfg.subject || DEFAULT_CA_HEADER_CONFIG.subject);
      } catch (e) {
        console.warn('loadCreditAuditHeaderConfig error:', e);
      }
    }
    window.loadCreditAuditHeaderConfig = loadCreditAuditHeaderConfig;

    function saveCreditAuditHeaderConfig() {
      try {
        const getVal = (id, def) => (document.getElementById(id)?.value || def).trim();
        const cfg = {
          name: getVal('caColName', DEFAULT_CA_HEADER_CONFIG.name),
          grade: getVal('caColGrade', DEFAULT_CA_HEADER_CONFIG.grade),
          semester: getVal('caColSemester', DEFAULT_CA_HEADER_CONFIG.semester),
          credit: getVal('caColCredit', DEFAULT_CA_HEADER_CONFIG.credit),
          class: getVal('caColClass', DEFAULT_CA_HEADER_CONFIG.class),
          number: getVal('caColNumber', DEFAULT_CA_HEADER_CONFIG.number),
          subject: getVal('caColSubject', DEFAULT_CA_HEADER_CONFIG.subject)
        };
        localStorage.setItem('ca_custom_header_config', JSON.stringify(cfg));
        
        // 현재 업로드된 파일이 있다면 새 열 제목 설정으로 즉시 재분석!
        if (window._lastCreditAuditRawRows && window._lastCreditAuditRawRows.length > 0) {
          processCreditAuditRows(window._lastCreditAuditRawRows);
        }
      } catch (e) {
        console.warn('saveCreditAuditHeaderConfig error:', e);
      }
    }
    window.saveCreditAuditHeaderConfig = saveCreditAuditHeaderConfig;

    function resetCreditAuditHeaderDefaults() {
      localStorage.removeItem('ca_custom_header_config');
      loadCreditAuditHeaderConfig();
      if (window._lastCreditAuditRawRows && window._lastCreditAuditRawRows.length > 0) {
        processCreditAuditRows(window._lastCreditAuditRawRows);
      }
    }
    window.resetCreditAuditHeaderDefaults = resetCreditAuditHeaderDefaults;

    // 엑셀 열 매칭: 띄어쓰기 무시, 대소문자 무시, 정규화
    function findColumnKey(availableKeys, patternString) {
      if (!patternString || !availableKeys || availableKeys.length === 0) return null;
      const targets = patternString.split(',')
        .map(s => s.trim().replace(/\s+/g, '').toLowerCase())
        .filter(Boolean);

      const cleanKeys = availableKeys.map(k => ({
        original: k,
        clean: String(k || '').trim().replace(/\s+/g, '').toLowerCase()
      }));

      // 1) 완전 일치
      for (const t of targets) {
        const hit = cleanKeys.find(k => k.clean === t);
        if (hit) return hit.original;
      }
      // 2) 포함 관계
      for (const t of targets) {
        const hit = cleanKeys.find(k => k.clean.includes(t) || t.includes(k.clean));
        if (hit) return hit.original;
      }
      return null;
    }

    // 파싱된 행 데이터를 집계 처리하는 공통 함수
    function processCreditAuditRows(rawRows) {
      if (!rawRows || rawRows.length === 0) return;
      window._lastCreditAuditRawRows = rawRows;

      const getVal = (id, def) => (document.getElementById(id)?.value || def).trim();
      const colNamePattern = getVal('caColName', DEFAULT_CA_HEADER_CONFIG.name);
      const colGradePattern = getVal('caColGrade', DEFAULT_CA_HEADER_CONFIG.grade);
      const colSemPattern = getVal('caColSemester', DEFAULT_CA_HEADER_CONFIG.semester);
      const colCreditPattern = getVal('caColCredit', DEFAULT_CA_HEADER_CONFIG.credit);
      const colClassPattern = getVal('caColClass', DEFAULT_CA_HEADER_CONFIG.class);
      const colNumPattern = getVal('caColNumber', DEFAULT_CA_HEADER_CONFIG.number);

      const keys = Object.keys(rawRows[0] || {});
      const nameKey = findColumnKey(keys, colNamePattern) || keys.find(k => /이름|성명|학생명/i.test(k));
      const gradeKey = findColumnKey(keys, colGradePattern) || keys.find(k => /학년/i.test(k));
      const semKey = findColumnKey(keys, colSemPattern) || keys.find(k => /학기/i.test(k));
      const creditKey = findColumnKey(keys, colCreditPattern) || keys.find(k => /단위|학점|시수/i.test(k));
      const classKey = findColumnKey(keys, colClassPattern) || keys.find(k => /반|학급/i.test(k));
      const numKey = findColumnKey(keys, colNumPattern) || keys.find(k => /번호/i.test(k));

      const studentMap = new Map();

      rawRows.forEach((row, idx) => {
        const name = String((nameKey ? row[nameKey] : '') || row['이름'] || row['성명'] || '').trim();
        if (!name) return;

        const classNum = String((classKey ? row[classKey] : '') || '1').replace(/[^0-9]/g, '') || '1';
        const studentNum = String((numKey ? row[numKey] : '') || (idx + 1)).replace(/[^0-9]/g, '') || String(idx + 1);
        const key = `${name}_${classNum}_${studentNum}`;

        if (!studentMap.has(key)) {
          studentMap.set(key, {
            id: 'ca_std_' + idx,
            classNum: classNum,
            studentNum: studentNum,
            studentIdStr: `${classNum}-${studentNum}`,
            name: name,
            credits: { '1-1': 0, '1-2': 0, '2-1': 0, '2-2': 0, '3-1': 0, '3-2': 0 }
          });
        }

        const st = studentMap.get(key);
        let g = String((gradeKey ? row[gradeKey] : '') || '1').replace(/[^1-3]/g, '') || '1';
        let s = String((semKey ? row[semKey] : '') || '1').replace(/[^1-2]/g, '') || '1';
        let cr = parseFloat((creditKey ? row[creditKey] : '') || 4) || 4;

        const semKeyStr = `${g}-${s}`;
        if (st.credits[semKeyStr] !== undefined) {
          st.credits[semKeyStr] += cr;
        }
      });

      window._creditAuditStudents = Array.from(studentMap.values());
      if (targetGrade && targetGrade !== 'all') {
        window._creditAuditGradeFilter = targetGrade;
      }
      renderCreditAuditTable();

      const gLabel = targetGrade === '2학년' ? '2학년' : (targetGrade === '3학년' ? '3학년' : '2·3학년 전체');
      if (typeof showToast === 'function') {
        showToast(`✅ [${gLabel}] 교과학습발달상황 기반 이수학점 점검이 완료되었습니다. (학생 ${studentMap.size}명)`);
      } else {
        alert(`✅ [${gLabel}] 교과학습발달상황 기반 이수학점 점검이 완료되었습니다. (학생 ${studentMap.size}명)`);
      }
    }
    window.processCreditAuditRows = processCreditAuditRows;

    // 1-1. 접기/펼치기 토글 함수
    function toggleCreditAuditSection(section) {
      if (section === 'creditSettings') {
        const body = document.getElementById('caCreditSettingsBody');
        const txt = document.getElementById('txtToggleCreditSettings');
        if (!body) return;
        const isHidden = body.classList.contains('hidden');
        if (isHidden) {
          body.classList.remove('hidden');
          if (txt) txt.textContent = '설정 접기 ▲';
        } else {
          body.classList.add('hidden');
          if (txt) txt.textContent = '설정 펼치기 ▾';
        }
      } else if (section === 'headerSettings') {
        const body = document.getElementById('caHeaderSettingsBody');
        const txt = document.getElementById('txtToggleHeaderSettings');
        if (!body) return;
        const isHidden = body.classList.contains('hidden');
        if (isHidden) {
          body.classList.remove('hidden');
          if (txt) txt.textContent = '설정 접기 ▲';
        } else {
          body.classList.add('hidden');
          if (txt) txt.textContent = '설정 펼치기 ▾';
        }
      }
    }
    window.toggleCreditAuditSection = toggleCreditAuditSection;

    // 학생 데이터 리스트 병합 (반/번호/이름 기준 과목 및 학점 누적 합산)
    function mergeCreditAuditStudentLists(existingList, newList) {
      const map = new Map();

      existingList.forEach(st => {
        map.set(st.key, JSON.parse(JSON.stringify(st)));
      });

      newList.forEach(st => {
        if (map.has(st.key)) {
          const cur = map.get(st.key);
          ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'].forEach(sem => {
            cur.credits[sem] = (cur.credits[sem] || 0) + (st.credits[sem] || 0);
          });
          cur.subjects = (cur.subjects || []).concat(st.subjects || []);
        } else {
          map.set(st.key, JSON.parse(JSON.stringify(st)));
        }
      });

      const merged = Array.from(map.values());
      merged.sort((a, b) => {
        const cA = parseInt(String(a.classNum).replace(/[^0-9]/g, ''), 10) || 0;
        const cB = parseInt(String(b.classNum).replace(/[^0-9]/g, ''), 10) || 0;
        if (cA !== cB) return cA - cB;
        const nA = parseInt(String(a.studentNum).replace(/[^0-9]/g, ''), 10) || 0;
        const nB = parseInt(String(b.studentNum).replace(/[^0-9]/g, ''), 10) || 0;
        return nA - nB;
      });

      return merged;
    }

    // 복수 엑셀 파일 비동기 읽기 및 일괄 병합 처리
    async function handleCreditAuditMultipleFiles(files) {
      if (!files || files.length === 0) return;
      const fileArr = Array.from(files);

      const cfg = (typeof getCreditAuditHeaderConfigObject === 'function')
        ? getCreditAuditHeaderConfigObject()
        : {
            name: document.getElementById('caColName')?.value,
            grade: document.getElementById('caColGrade')?.value,
            semester: document.getElementById('caColSemester')?.value,
            credit: document.getElementById('caColCredit')?.value,
            class: document.getElementById('caColClass')?.value,
            number: document.getElementById('caColNumber')?.value,
            subject: document.getElementById('caColSubject')?.value
          };

      let combinedStudents = [];
      const fileNames = [];

      for (let i = 0; i < fileArr.length; i++) {
        const file = fileArr[i];
        fileNames.push(file.name);
        try {
          const buffer = await file.arrayBuffer();
          const data = new Uint8Array(buffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const raw2D = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

          if (raw2D && raw2D.length > 0) {
            const parsed = parseSmartCreditAudit2D(raw2D, cfg);
            combinedStudents = mergeCreditAuditStudentLists(combinedStudents, parsed);
          }
        } catch (err) {
          console.warn('File read error:', file.name, err);
        }
      }

      window._creditAuditStudents = combinedStudents;
      renderCreditAuditTable();

      const fileInfo = document.getElementById('creditAuditFileInfo');
      const fileNameSpan = document.getElementById('creditAuditFileName');
      if (fileInfo && fileNameSpan) {
        const namesSummary = fileNames.length === 1 
          ? fileNames[0] 
          : `총 ${fileNames.length}개 파일 (${fileNames[0]} 외 ${fileNames.length - 1}개)`;
        fileNameSpan.textContent = `📄 로드된 파일: ${namesSummary} (총 ${combinedStudents.length}명 추출)`;
        fileInfo.classList.remove('hidden');
      }

      alert(`🎉 총 ${fileNames.length}개 엑셀 파일에서 총 ${combinedStudents.length}명의 학기별 이수 학점을 성공적으로 병합·분석했습니다!`);
    }
    window.handleCreditAuditMultipleFiles = handleCreditAuditMultipleFiles;
    window.handleCreditAuditFileUpload = function(file) {
      if (file) handleCreditAuditMultipleFiles([file]);
    };

        // 2-0. 학기별 이수학점 점검 드래그 앤 드롭 영역 이벤트 초기화
    function initCreditAuditDropZone() {
      const zone = document.getElementById('creditAuditDropZone');
      const input = document.getElementById('creditAuditFileInput');
      if (!zone || zone._dndBound) return;
      zone._dndBound = true;

      ['dragenter', 'dragover'].forEach(name => {
        zone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          zone.classList.add('border-indigo-600', 'bg-indigo-100/70', 'ring-4', 'ring-indigo-200');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        zone.addEventListener(name, (e) => {
          e.preventDefault();
          e.stopPropagation();
          zone.classList.remove('border-indigo-600', 'bg-indigo-100/70', 'ring-4', 'ring-indigo-200');
        });
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          window.handleCreditAuditMultipleFiles(e.dataTransfer.files);
        }
      });

      if (input && !input._changeBound) {
        input._changeBound = true;
        input.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            window.handleCreditAuditFileUpload(e.target.files[0]);
            e.target.value = '';
          }
        });
      }
    }
    window.initCreditAuditDropZone = initCreditAuditDropZone;

    // 2. 별도 교과학습발달상황 엑셀 파일 직접 업로드 처리 (NEIS 실제 양식 완벽 파서)
    function parseSmartCreditAudit2D(sheetRows, headerConfig = {}) {
      const norm = s => String(s || '').trim().replace(/\s+/g, '').toLowerCase();

      const cfg = {
        name: (headerConfig.name || '성명, 이름, 학생명').split(',').map(norm).filter(Boolean),
        grade: (headerConfig.grade || '학년').split(',').map(norm).filter(Boolean),
        semester: (headerConfig.semester || '학기').split(',').map(norm).filter(Boolean),
        credit: (headerConfig.credit || '학점, 단위수, 단위, 시수, 이수학점, 이수단위').split(',').map(norm).filter(Boolean),
        class: (headerConfig.class || '반, 학급').split(',').map(norm).filter(Boolean),
        number: (headerConfig.number || '번호').split(',').map(norm).filter(Boolean),
        subject: (headerConfig.subject || '과목명, 과목, 교과목').split(',').map(norm).filter(Boolean)
      };

      const matchesAny = (cellVal, targetList) => {
        const c = norm(cellVal);
        if (!c) return 0;
        if (targetList.includes(c)) return 2;
        if (targetList.some(t => c.includes(t) || t.includes(c))) return 1;
        return 0;
      };

      let colMap = null;
      let currentClass = '1';
      let currentGradeContext = '1';
      let currentStudent = null;
      let currentGrade = '1';
      let currentSemester = '1';

      const students = [];

      for (let r = 0; r < sheetRows.length; r++) {
        const row = sheetRows[r];
        if (!row || !Array.isArray(row)) continue;
        const rowJoined = row.join(' ');
        const cleanRowStr = norm(rowJoined);

        // 1) 반/학년 헤더 감지 (예: '1학년 1반', '제 1 학년 2 반', '1-2반')
        const classMatch = rowJoined.match(/(\d+)\s*학년\s*(\d+)\s*반/i) || rowJoined.match(/(\d+)\s*-\s*(\d+)\s*반?/);
        if (classMatch) {
          currentGradeContext = classMatch[1];
          currentClass = classMatch[2];
        }

        // 2) 헤더 행인지 판별
        let headerHits = 0;
        const tempMap = {};
        const bestScores = {};

        row.forEach((cell, cIdx) => {
          const c = norm(cell);
          if (!c) return;

          const testCol = (key, list) => {
            const score = matchesAny(c, list);
            if (score > 0 && (!bestScores[key] || score > bestScores[key])) {
              if (key === 'subject' && (c === '교과' || c.startsWith('교과('))) return;
              bestScores[key] = score;
              tempMap[key] = cIdx;
            }
          };

          testCol('number', cfg.number);
          testCol('name', cfg.name);
          testCol('grade', cfg.grade);
          testCol('semester', cfg.semester);
          testCol('subject', cfg.subject);
          testCol('credit', cfg.credit);
          testCol('class', cfg.class);
        });

        if (tempMap.credit !== undefined && tempMap.subject !== undefined) {
          colMap = tempMap;
          continue;
        }

        if (!colMap) continue;

        // 3) 합계 행, 페이지 구분선 스킵
        if (cleanRowStr.includes('합계') || cleanRowStr.includes('총점')) continue;
        const filledCells = row.filter(c => String(c).trim() !== '');
        if (filledCells.length <= 3 && /^\d+\s*\/\s*\d+$/.test(cleanRowStr.replace(/[^0-9\/]/g, ''))) continue;

        const getCell = (colIdx) => (colIdx !== undefined && row[colIdx] !== undefined) ? String(row[colIdx]).trim() : '';

        const cellNum = getCell(colMap.number);
        const cellName = getCell(colMap.name);
        const cellGrade = getCell(colMap.grade);
        const cellSem = getCell(colMap.semester);
        const cellSubj = getCell(colMap.subject);
        const cellCredit = getCell(colMap.credit);
        const cellClass = getCell(colMap.class);

        if (cellClass) {
          const clParsed = cellClass.replace(/[^0-9]/g, '');
          if (clParsed) currentClass = clParsed;
        }

        // 4) 학생 감지: 번호 열에 숫자가 있거나, 성명 열에 유효 텍스트가 있는 경우
        const parsedNum = cellNum.replace(/[^0-9]/g, '');
        const hasNum = parsedNum !== '' && !isNaN(parseInt(parsedNum, 10));
        const hasName = cellName !== '' && !cellName.includes('성명') && !cellName.includes('이름');

        if (hasNum || hasName) {
          const stdNum = hasNum ? parsedNum : (currentStudent ? String(parseInt(currentStudent.studentNum, 10) + 1) : '1');
          const stdName = hasName ? cellName : `${currentClass}반 ${stdNum}번`;
          const key = `${currentClass}_${stdNum}_${stdName}`;

          currentStudent = students.find(s => s.key === key);
          if (!currentStudent) {
            currentStudent = {
              id: 'ca_std_' + (students.length + 1),
              key: key,
              classNum: currentClass,
              studentNum: stdNum,
              studentIdStr: `${currentClass}-${stdNum.padStart(2, '0')}`,
              name: stdName,
              credits: { '1-1': 0, '1-2': 0, '2-1': 0, '2-2': 0, '3-1': 0, '3-2': 0 },
              subjects: []
            };
            students.push(currentStudent);
          }
        }

        // 학년/학기 fill-down
        if (cellGrade) {
          const gParsed = cellGrade.replace(/[^1-3]/g, '');
          if (gParsed) currentGrade = gParsed;
        } else if (!currentGrade) {
          currentGrade = currentGradeContext;
        }

        if (cellSem) {
          if (/2\s*학기|(?:^|[^\d])2(?:$|[^\d])/.test(cellSem)) currentSemester = '2';
          else if (/1\s*학기|(?:^|[^\d])1(?:$|[^\d])/.test(cellSem)) currentSemester = '1';
        }

        // 5) 과목 및 학점 처리
        const creditVal = parseFloat(cellCredit);
        const isValidSubject = cellSubj && !cellSubj.includes('합계') && !cellSubj.includes('과목');

        if (currentStudent && isValidSubject && !isNaN(creditVal) && creditVal > 0) {
          const semKey = `${currentGrade}-${currentSemester}`;
          if (currentStudent.credits[semKey] !== undefined) {
            currentStudent.credits[semKey] += creditVal;
          }
          currentStudent.subjects.push({
            sem: semKey,
            subject: cellSubj,
            credit: creditVal
          });
        }
      }

      return students;
    }

    function handleCreditAuditFileUpload(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // 2차원 배열로 완벽하게 추출하여 NEIS 복합 양식 파싱 지원
          const raw2D = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
          if (!raw2D || raw2D.length === 0) {
            alert('엑셀 파일에 유효한 데이터가 없습니다.');
            return;
          }

          window._lastCreditAuditRaw2D = raw2D;
          const cfg = (typeof getCreditAuditHeaderConfigObject === 'function') 
            ? getCreditAuditHeaderConfigObject() 
            : {
                name: document.getElementById('caColName')?.value,
                grade: document.getElementById('caColGrade')?.value,
                semester: document.getElementById('caColSemester')?.value,
                credit: document.getElementById('caColCredit')?.value,
                class: document.getElementById('caColClass')?.value,
                number: document.getElementById('caColNumber')?.value,
                subject: document.getElementById('caColSubject')?.value
              };

          const parsedStudents = parseSmartCreditAudit2D(raw2D, cfg);
          if (parsedStudents.length === 0) {
            // 폴백: 일반 단순 표 형식 시도
            const flatRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
            if (flatRows && flatRows.length > 0 && typeof processCreditAuditRows === 'function') {
              processCreditAuditRows(flatRows);
            }
          } else {
            window._creditAuditStudents = parsedStudents;
            renderCreditAuditTable();
          }

          const fileInfo = document.getElementById('creditAuditFileInfo');
          const fileName = document.getElementById('creditAuditFileName');
          if (fileInfo && fileName) {
            fileName.textContent = `📄 로드된 파일: ${file.name} (총 ${(window._creditAuditStudents || []).length}명 추출)`;
            fileInfo.classList.remove('hidden');
          }

          alert(`🎉 [${file.name}] 파일에서 총 ${(window._creditAuditStudents || []).length}명의 학기별 이수 학점을 분석했습니다!`);
        } catch (err) {
          console.error(err);
          alert('엑셀 분석 중 오류가 발생했습니다: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    window.handleCreditAuditFileUpload = handleCreditAuditFileUpload;

    function clearCreditAuditFile() {
      const fileInput = document.getElementById('creditAuditFileInput');
      const fileInfo = document.getElementById('creditAuditFileInfo');
      if (fileInput) fileInput.value = '';
      if (fileInfo) fileInfo.classList.add('hidden');
      runCreditAuditFromCurrentSystem();
    }
    window.clearCreditAuditFile = clearCreditAuditFile;

    function setCreditAuditFilter(filter) {
      window._creditAuditFilter = filter;
      ['all', 'any-fail', '1-1', '1-2', '2-1', '2-2', '3-1', '3-2'].forEach(k => {
        const btn = document.getElementById('caFilterBtn-' + k);
        if (!btn) return;
        if (k === filter) {
          btn.className = 'px-2.5 py-1 rounded-lg font-black bg-indigo-600 text-white shadow-2xs transition';
        } else {
          btn.className = k === 'any-fail' 
            ? 'px-2.5 py-1 rounded-lg font-black bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition'
            : 'px-2.5 py-1 rounded-lg font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition';
        }
      });
      renderCreditAuditTable();
    }
    window.setCreditAuditFilter = setCreditAuditFilter;

    window._creditAuditGradeFilter = 'all';

    function setCreditAuditGradeFilter(grade) {
      window._creditAuditGradeFilter = grade;
      renderCreditAuditTable();
    }
    window.setCreditAuditGradeFilter = setCreditAuditGradeFilter;

    // 학년별 이수 도래 학기 판별 (2학년: 1-1, 1-2(데이터 있을시) / 3학년: 1-1, 1-2, 2-1, 2-2(데이터 있을시))
    function isApplicableCreditSemester(st, semKey) {
      const g = st.grade || '2학년';
      if (g === '2학년') {
        if (semKey === '1-1') return true;
        if (semKey === '1-2') return (st.credits['1-2'] || 0) > 0;
        return false;
      } else {
        if (semKey === '1-1' || semKey === '1-2' || semKey === '2-1') return true;
        if (semKey === '2-2') return (st.credits['2-2'] || 0) > 0;
        return false;
      }
    }
    window.isApplicableCreditSemester = isApplicableCreditSemester;

    function renderCreditAuditTable() {
      const allList = window._creditAuditStudents || [];
      const tbody = document.getElementById('caResultsTableBody');
      const emptyState = document.getElementById('caResultsEmptyState');
      const searchVal = (document.getElementById('caSearchInput')?.value || '').trim().toLowerCase();
      const req = getCreditAuditRequired();
      const gradeFilter = window._creditAuditGradeFilter || 'all';

      // 학년별 통계 뱃지 및 버튼 스타일 갱신
      const g2Count = allList.filter(st => st.grade === '2학년').length;
      const g3Count = allList.filter(st => st.grade === '3학년').length;

      const gBtnAll = document.getElementById('caGradeFilterBtn-all');
      const gBtn2 = document.getElementById('caGradeFilterBtn-2');
      const gBtn3 = document.getElementById('caGradeFilterBtn-3');
      const gCntAll = document.getElementById('caGradeCnt-all');
      const gCnt2 = document.getElementById('caGradeCnt-2');
      const gCnt3 = document.getElementById('caGradeCnt-3');

      if (gCntAll) gCntAll.textContent = `(${allList.length})`;
      if (gCnt2) gCnt2.textContent = `(${g2Count})`;
      if (gCnt3) gCnt3.textContent = `(${g3Count})`;

      const activeGClass = 'px-2.5 py-1 rounded-md text-xs font-black bg-indigo-600 text-white transition shadow-2xs';
      const inactiveGClass = 'px-2.5 py-1 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-100 transition';

      if (gBtnAll) gBtnAll.className = gradeFilter === 'all' ? activeGClass : inactiveGClass;
      if (gBtn2) gBtn2.className = gradeFilter === '2학년' ? activeGClass : inactiveGClass;
      if (gBtn3) gBtn3.className = gradeFilter === '3학년' ? activeGClass : inactiveGClass;

      // 학년 필터링 적용
      let list = allList;
      if (gradeFilter !== 'all') {
        list = allList.filter(st => st.grade === gradeFilter);
      }

      let passCount = 0;
      let failCount = 0;
      const failCountBySem = { '1-1': 0, '1-2': 0, '2-1': 0, '2-2': 0, '3-1': 0, '3-2': 0 };

      list.forEach(st => {
        let isPass = true;
        let evaluatedAny = false;
        ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'].forEach(k => {
          if (!isApplicableCreditSemester(st, k)) return;
          evaluatedAny = true;
          if ((st.credits[k] || 0) < req[k]) {
            isPass = false;
            failCountBySem[k]++;
          }
        });
        if (evaluatedAny && isPass) passCount++;
        else if (evaluatedAny && !isPass) failCount++;
        else passCount++;
      });

      const statTotal = document.getElementById('caStatTotalStudents');
      const statPass = document.getElementById('caStatPassStudents');
      const statFail = document.getElementById('caStatFailStudents');
      if (statTotal) statTotal.textContent = `${list.length}명`;
      if (statPass) statPass.textContent = `${passCount}명`;
      if (statFail) statFail.textContent = `${failCount}명`;

      const cntAll = document.getElementById('caCnt-all');
      const cntFail = document.getElementById('caCnt-any-fail');
      if (cntAll) cntAll.textContent = list.length;
      if (cntFail) cntFail.textContent = failCount;

      ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'].forEach(k => {
        const el = document.getElementById('caCnt-' + k);
        if (el) el.textContent = failCountBySem[k];
      });

      const filtered = list.filter(st => {
        if (searchVal) {
          const matchName = st.name.toLowerCase().includes(searchVal);
          const matchNum = String(st.studentIdStr || '').includes(searchVal);
          if (!matchName && !matchNum) return false;
        }

        const filter = window._creditAuditFilter || 'all';
        if (filter === 'all') return true;
        if (filter === 'any-fail') {
          return ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'].some(k => isApplicableCreditSemester(st, k) && (st.credits[k] || 0) < req[k]);
        }
        return isApplicableCreditSemester(st, filter) && (st.credits[filter] || 0) < req[filter];
      });

      const countBadge = document.getElementById('caResultCountBadge');
      const gradeLabelStr = gradeFilter === 'all' ? '전체 학년' : gradeFilter;
      if (countBadge) countBadge.textContent = `${gradeLabelStr} 총 ${filtered.length}명 표시`;

      if (!tbody) return;

      if (filtered.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');

      tbody.innerHTML = filtered.map(st => {
        let totalCr = 0;
        let failSems = [];

        const tdSems = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'].map(k => {
          const isApp = isApplicableCreditSemester(st, k);
          if (!isApp) {
            return `
              <td class="p-2 text-center border-r border-slate-200 bg-slate-50/50 text-slate-400 font-medium select-none" title="미도래 학기 (평가 제외)">
                <span>-</span>
              </td>
            `;
          }

          const cr = st.credits[k] || 0;
          totalCr += cr;
          const isMet = cr >= req[k];
          if (!isMet) failSems.push(k);

          const diff = cr - req[k];
          const diffStr = diff < 0 ? `(${diff})` : '';

          return `
            <td class="p-2 text-center border-r border-slate-200 ${isMet ? '' : 'bg-rose-50 text-rose-700 font-black'}">
              <span class="font-bold">${cr}</span>
              ${diffStr ? `<span class="text-[10px] ml-0.5 font-extrabold text-rose-600">${diffStr}</span>` : ''}
            </td>
          `;
        }).join('');

        const isAllPass = failSems.length === 0;

        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-2 text-center font-bold border-r border-slate-200 whitespace-nowrap">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-black ${st.grade === '2학년' ? 'bg-sky-100 text-sky-800 border border-sky-300' : 'bg-purple-100 text-purple-800 border border-purple-300'}">
                ${st.grade || '2학년'}
              </span>
            </td>
            <td class="p-2 text-center font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap">${st.studentIdStr}</td>
            <td class="p-2 text-center font-black text-slate-900 border-r border-slate-200 whitespace-nowrap">${st.name}</td>
            ${tdSems}
            <td class="p-2 text-center font-black text-indigo-700 bg-slate-50 border-r border-slate-200 whitespace-nowrap">${totalCr}학점</td>
            <td class="p-2 text-center whitespace-nowrap">
              ${isAllPass 
                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">✅ 충족</span>'
                : `<span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">🚨 ${failSems.length}개 미충족</span>`
              }
            </td>
          </tr>
        `;
      }).join('');
    }
    window.renderCreditAuditTable = renderCreditAuditTable;

    function exportCreditAuditExcel() {
      const list = window._creditAuditStudents || [];
      if (list.length === 0) {
        alert('내보낼 분석 데이터가 없습니다.');
        return;
      }
      const req = getCreditAuditRequired();

      const rows = [
        ['상지대관령고등학교 학기별 이수학점 점검 결과표'],
        [`기준 학점: 1-1(${req['1-1']}), 1-2(${req['1-2']}), 2-1(${req['2-1']}), 2-2(${req['2-2']}), 3-1(${req['3-1']}), 3-2(${req['3-2']}) | 출력일시: ${new Date().toLocaleString()}`],
        [],
        ['학년', '학번/번호', '학생명', '1학년 1학기', '1학년 2학기', '2학년 1학기', '2학년 2학기', '3학년 1학기', '3학년 2학기', '누적 총학점', '최종 판정', '미충족 학기']
      ];

      list.forEach(st => {
        let totalCr = 0;
        let failSems = [];
        const semValues = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'].map(k => {
          if (!isApplicableCreditSemester(st, k)) {
            return '-';
          }
          const cr = st.credits[k] || 0;
          totalCr += cr;
          if (cr < req[k]) failSems.push(`${k}(${cr - req[k]})`);
          return cr;
        });

        rows.push([
          st.grade || '2학년',
          st.studentIdStr,
          st.name,
          semValues[0],
          semValues[1],
          semValues[2],
          semValues[3],
          semValues[4],
          semValues[5],
          totalCr,
          failSems.length === 0 ? '충족' : '미충족',
          failSems.join(', ') || '-'
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, '학기별_이수학점_점검표');

      const fileName = `상지대관령고_학기별_이수학점_점검표_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    }
    window.exportCreditAuditExcel = exportCreditAuditExcel;

    // =========================================================================
    // 각 업로드 영역 엑셀 양식(템플릿) 다운로드 함수 모음
    // =========================================================================

    // 1. 사전 데이터 등록 양식 다운로드 (1학기 또는 2학기)
    function downloadPriorDataTemplate(semester = 1) {
      const rows = [
        ['학년', '학기', '반', '번호', '성명', '과목명', '단위수', '이수구분'],
        ['2학년', `${semester}학기`, '1', '1', '홍길동', '문학', 4, '지정'],
        ['2학년', `${semester}학기`, '1', '1', '홍길동', '수학Ⅰ', 4, '지정'],
        ['2학년', `${semester}학기`, '1', '1', '홍길동', '물리학Ⅰ', 3, '선택'],
        ['2학년', `${semester}학기`, '1', '1', '홍길동', '일본어Ⅰ', 3, '선택'],
        ['2학년', `${semester}학기`, '1', '2', '김철수', '문학', 4, '지정'],
        ['2학년', `${semester}학기`, '1', '2', '김철수', '수학Ⅰ', 4, '지정'],
        ['2학년', `${semester}학기`, '1', '2', '김철수', '화학Ⅰ', 3, '선택'],
        ['2학년', `${semester}학기`, '1', '2', '김철수', '중국어Ⅰ', 3, '선택']
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `${semester}학기_사전데이터_양식`);
      XLSX.writeFile(wb, `상지대관령고_${semester}학기_사전데이터_표준양식.xlsx`);
    }
    window.downloadPriorDataTemplate = downloadPriorDataTemplate;

    // 2. 학기별 이수학점 점검 (전입생용) 양식 다운로드
    function downloadCreditAuditTemplate() {
      const rows = [
        ['학생명', '반', '번호', '학년', '학기', '과목명', '단위수(학점)'],
        ['이전입', '1', '1', '1', '1', '국어', 4],
        ['이전입', '1', '1', '1', '1', '수학', 4],
        ['이전입', '1', '1', '1', '1', '영어', 4],
        ['이전입', '1', '1', '1', '1', '한국사', 3],
        ['이전입', '1', '1', '1', '1', '통합사회', 4],
        ['이전입', '1', '1', '1', '1', '통합과학', 4],
        ['이전입', '1', '1', '1', '1', '과학탐구실험', 1],
        ['이전입', '1', '1', '1', '1', '체육', 2],
        ['이전입', '1', '1', '1', '1', '음악', 3],
        ['이전입', '1', '1', '1', '2', '국어', 4],
        ['이전입', '1', '1', '1', '2', '수학', 4],
        ['이전입', '1', '1', '1', '2', '영어', 4],
        ['이전입', '1', '1', '1', '2', '한국사', 3],
        ['이전입', '1', '1', '1', '2', '통합사회', 4],
        ['이전입', '1', '1', '1', '2', '통합과학', 4],
        ['이전입', '1', '1', '1', '2', '과학탐구실험', 1],
        ['이전입', '1', '1', '1', '2', '체육', 2],
        ['이전입', '1', '1', '1', '2', '미술', 3]
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, '교과학습_이수학점_양식');
      XLSX.writeFile(wb, '상지대관령고_교과학습발달상황_이수학점_표준양식.xlsx');
    }
    window.downloadCreditAuditTemplate = downloadCreditAuditTemplate;
  

        // ==========================================