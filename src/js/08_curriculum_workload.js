    // 6. ALL GRADES CURRICULUM & TEACHER WORKLOAD CONSOLIDATION (전체 탭)
    // ==========================================

    // (상단 0번 섹션에 getBaseSubjectName, getSubjectDivision, normalizeSubjectKey, normalizeSubject 선언됨)


    const sampleCurriculumData = [
      // 1학년 1학기 (지정)
      { semester: 1, grade: '1학년', category: '지정', subject: '공통국어1', hours: 4, teacher: '김국어' },
      { semester: 1, grade: '1학년', category: '지정', subject: '공통수학1', hours: 4, teacher: '이수학' },
      { semester: 1, grade: '1학년', category: '지정', subject: '공통영어1', hours: 4, teacher: '박영어' },
      { semester: 1, grade: '1학년', category: '지정', subject: '한국사1', hours: 3, teacher: '최역사' },
      { semester: 1, grade: '1학년', category: '지정', subject: '통합사회1', hours: 3, teacher: '정사회' },
      { semester: 1, grade: '1학년', category: '지정', subject: '통합과학1', hours: 4, teacher: '강과학' },
      { semester: 1, grade: '1학년', category: '지정', subject: '체육1', hours: 2, teacher: '조체육' },
      { semester: 1, grade: '1학년', category: '지정', subject: '음악', hours: 2, teacher: '윤음악' },

      // 1학년 2학기 (지정)
      { semester: 2, grade: '1학년', category: '지정', subject: '공통국어2', hours: 4, teacher: '김국어' },
      { semester: 2, grade: '1학년', category: '지정', subject: '공통수학2', hours: 4, teacher: '이수학' },
      { semester: 2, grade: '1학년', category: '지정', subject: '공통영어2', hours: 4, teacher: '박영어' },
      { semester: 2, grade: '1학년', category: '지정', subject: '한국사2', hours: 3, teacher: '최역사' },
      { semester: 2, grade: '1학년', category: '지정', subject: '통합사회2', hours: 3, teacher: '정사회' },
      { semester: 2, grade: '1학년', category: '지정', subject: '통합과학2', hours: 4, teacher: '강과학' },
      { semester: 2, grade: '1학년', category: '지정', subject: '체육2', hours: 2, teacher: '조체육' },
      { semester: 2, grade: '1학년', category: '지정', subject: '미술', hours: 2, teacher: '한미술' },

      // 2학년 1학기 (지정 + 선택)
      { semester: 1, grade: '2학년', category: '지정', subject: '문학', hours: 4, teacher: '김국어' },
      { semester: 1, grade: '2학년', category: '지정', subject: '수학I', hours: 4, teacher: '이수학' },
      { semester: 1, grade: '2학년', category: '지정', subject: '영어I', hours: 4, teacher: '박영어' },
      { semester: 1, grade: '2학년', category: '선택', subject: '물리학I', hours: 3, teacher: '강과학' },
      { semester: 1, grade: '2학년', category: '선택', subject: '화학I', hours: 3, teacher: '송화학' },
      { semester: 1, grade: '2학년', category: '선택', subject: '생명과학I', hours: 3, teacher: '윤생명' },
      { semester: 1, grade: '2학년', category: '선택', subject: '지구과학I', hours: 3, teacher: '강과학' },
      { semester: 1, grade: '2학년', category: '선택', subject: '생활과 윤리', hours: 3, teacher: '정사회' },
      { semester: 1, grade: '2학년', category: '선택', subject: '세계지리', hours: 3, teacher: '배지리' },
      { semester: 1, grade: '2학년', category: '선택', subject: '일본어I', hours: 3, teacher: '오일어' },
      { semester: 1, grade: '2학년', category: '선택', subject: '중국어I', hours: 3, teacher: '신중어' },

      // 2학년 2학기 (지정 + 선택)
      { semester: 2, grade: '2학년', category: '지정', subject: '독서', hours: 4, teacher: '김국어' },
      { semester: 2, grade: '2학년', category: '지정', subject: '수학II', hours: 4, teacher: '이수학' },
      { semester: 2, grade: '2학년', category: '지정', subject: '영어II', hours: 4, teacher: '박영어' },
      { semester: 2, grade: '2학년', category: '선택', subject: '물리학I', hours: 3, teacher: '강과학' },
      { semester: 2, grade: '2학년', category: '선택', subject: '화학I', hours: 3, teacher: '송화학' },
      { semester: 2, grade: '2학년', category: '선택', subject: '생명과학I', hours: 3, teacher: '윤생명' },
      { semester: 2, grade: '2학년', category: '선택', subject: '윤리와 사상', hours: 3, teacher: '정사회' },
      { semester: 2, grade: '2학년', category: '선택', subject: '한국지리', hours: 3, teacher: '배지리' },
      { semester: 2, grade: '2학년', category: '선택', subject: '일본어I', hours: 3, teacher: '오일어' },

      // 3학년 1학기 (지정 + 선택)
      { semester: 1, grade: '3학년', category: '지정', subject: '운동과 건강', hours: 2, teacher: '조체육' },
      { semester: 1, grade: '3학년', category: '선택', subject: '화법과 작문', hours: 3, teacher: '권국어' },
      { semester: 1, grade: '3학년', category: '선택', subject: '언어와 매체', hours: 3, teacher: '권국어' },
      { semester: 1, grade: '3학년', category: '선택', subject: '미적분', hours: 3, teacher: '황수학' },
      { semester: 1, grade: '3학년', category: '선택', subject: '확률과 통계', hours: 3, teacher: '황수학' },
      { semester: 1, grade: '3학년', category: '선택', subject: '기하', hours: 3, teacher: '황수학' },
      { semester: 1, grade: '3학년', category: '선택', subject: '영어 독해와 작문', hours: 3, teacher: '유영어' },
      { semester: 1, grade: '3학년', category: '선택', subject: '물리학II', hours: 3, teacher: '강과학' },
      { semester: 1, grade: '3학년', category: '선택', subject: '화학II', hours: 3, teacher: '송화학' },
      { semester: 1, grade: '3학년', category: '선택', subject: '생명과학II', hours: 3, teacher: '윤생명' },
      { semester: 1, grade: '3학년', category: '선택', subject: '정치와 법', hours: 3, teacher: '정사회' },

      // 3학년 2학기 (지정 + 선택)
      { semester: 2, grade: '3학년', category: '지정', subject: '스포츠 생활', hours: 2, teacher: '조체육' },
      { semester: 2, grade: '3학년', category: '선택', subject: '심화 국어', hours: 3, teacher: '권국어' },
      { semester: 2, grade: '3학년', category: '선택', subject: '경제 수학', hours: 3, teacher: '황수학' },
      { semester: 2, grade: '3학년', category: '선택', subject: '심화 영어I', hours: 3, teacher: '유영어' },
      { semester: 2, grade: '3학년', category: '선택', subject: '과학과제 연구', hours: 3, teacher: '강과학' },
      { semester: 2, grade: '3학년', category: '선택', subject: '사회문제 탐구', hours: 3, teacher: '정사회' }
    ];

    // 기초 데이터 공유 정책: 동일 학년도 하위 모든 날짜 탭에서 100% 실시간 공유
    // 과목 항목 정규화 헬퍼 (구버전/다양한 JSON 백업 호환성 100% 보장: grade 숫자형, division 미지정 등 자동 보정)
    function sanitizeCurriculumItem(c, idx = 0) {
      if (!c || typeof c !== 'object') return null;

      // 1. grade 정규화 ('1', 1, '1학년' -> '1학년')
      let gStr = String(c.grade || '2학년').trim();
      if (!gStr.endsWith('학년')) {
        const m = gStr.match(/[123]/);
        gStr = (m ? m[0] : '2') + '학년';
      }

      // 2. semester 정규화 (1, 2)
      let sem = parseInt(c.semester || 1, 10);
      if (sem !== 1 && sem !== 2) sem = 1;

      // 3. division 정규화 ('1', 1 -> '1반', '2', 2 -> '2반')
      let div = '';
      if (c.division !== undefined && c.division !== null) {
        div = String(c.division).trim();
        if (div === '1') div = '1반';
        else if (div === '2') div = '2반';
        else if (div === '3') div = '3반';
      }

      // 4. hours 정규화
      let hrs = parseFloat(c.hours);
      if (isNaN(hrs) || hrs < 0) hrs = 0;

      // 5. id 보장
      const id = c.id ? String(c.id) : ('curr_id_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5));

      const subj = String(c.subject || '').trim() || '미지정 과목';

      return {
        id: id,
        grade: gStr,
        semester: sem,
        category: String(c.category || (gStr === '1학년' ? '지정' : '선택')).trim(),
        division: div,
        subject: subj,
        baseSubject: c.baseSubject || getBaseSubjectName(subj),
        hours: hrs,
        teacher: String(c.teacher || '').trim(),
        originalTeacher: String(c.originalTeacher || c.teacher || '').trim(),
        status: (c.status === '폐강' || c.teacher === '폐강') ? '폐강' : '개설',
        isModified: Boolean(c.isModified)
      };
    }

    function getAllGradesCurriculum() {
      const acadYear = MultiState?.activeAcademicYear || '2027학년도';
      if (!MultiState.curriculumByAcademicYear) MultiState.curriculumByAcademicYear = {};

      let list = MultiState.curriculumByAcademicYear[acadYear];
      if (!list || !Array.isArray(list)) {
        // 하위 호환성 마이그레이션: 기존 날짜 탭의 전체 데이터에서 복원
        const y = MultiState?.activeYear;
        const acadData = getAcadData(acadYear);
        if (y && acadData[y] && acadData[y]['전체'] && Array.isArray(acadData[y]['전체'].curriculum) && acadData[y]['전체'].curriculum.length > 0) {
          list = acadData[y]['전체'].curriculum;
          MultiState.curriculumByAcademicYear[acadYear] = list;
        } else {
          list = [];
          MultiState.curriculumByAcademicYear[acadYear] = list;
        }
      }

      // 모든 과목 항목 정규화 및 고유 id 보장
      let updated = false;
      const seenIds = new Set();
      const sanitizedList = [];

      list.forEach((rawItem, idx) => {
        const item = sanitizeCurriculumItem(rawItem, idx);
        if (!item) return;
        if (item.id && String(item.id).startsWith('step3_supp_')) return; // 가상 생성 보완 과목 영구 배제
        if (seenIds.has(item.id)) {
          item.id = 'curr_id_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 5);
          updated = true;
        }
        seenIds.add(item.id);
        sanitizedList.push(item);
      });

      MultiState.curriculumByAcademicYear[acadYear] = sanitizedList;
      if (updated || sanitizedList.length !== list.length) {
        saveAllState();
      }

      return sanitizedList;
    }

    function setAllGradesCurriculum(newCurriculum) {
      const acadYear = MultiState?.activeAcademicYear || '2027학년도';
      if (!MultiState.curriculumByAcademicYear) MultiState.curriculumByAcademicYear = {};
      MultiState.curriculumByAcademicYear[acadYear] = newCurriculum;

      // 하위 호환성 동기화: 날짜 탭들에도 기록
      const acadData = getAcadData(acadYear);
      const dateList = (MultiState.datesByAcademicYear && MultiState.datesByAcademicYear[acadYear]) || MultiState.yearsList || [];
      dateList.forEach(d => {
        if (!acadData[d]) acadData[d] = {};
        if (!acadData[d]['전체']) acadData[d]['전체'] = {};
        acadData[d]['전체'].curriculum = newCurriculum;
        acadData[d]['전체'].lastUpdated = new Date().toISOString();
      });

      saveAllState();
    }

    // 교사 순서 정렬: 전역(모든 탭 공유) 관리
    function getTeacherOrder() {
      if (MultiState && Array.isArray(MultiState.customTeacherOrder)) {
        return MultiState.customTeacherOrder;
      }
      return [];
    }

    function setTeacherOrder(newOrder) {
      if (!MultiState) return;
      MultiState.customTeacherOrder = Array.isArray(newOrder) ? [...newOrder] : [];
      saveAllState();
    }

    function getStep2OpenedSubjects(year, gradeStr, semesterNum) {
      const yData = getAcadData()[year] || {};
      const gData = yData[gradeStr] || {};
      const closedList = gData.closedSubjects?.[semesterNum] || [];
      const closedNorms = new Set(closedList.map(s => normalizeSubjectKey(s)));

      let plan = null;
      if (gData.currentPlans && gData.currentPlans[semesterNum]) {
        plan = gData.currentPlans[semesterNum];
      } else if (gData.currentPlan && gData.currentPlan.semester === semesterNum) {
        plan = gData.currentPlan;
      } else {
        const saved = (gData.savedPlans || []).filter(p => p.semester === semesterNum);
        if (saved.length > 0) plan = saved[saved.length - 1];
      }
      if (!plan || plan.semester !== semesterNum || !plan.groups || !Array.isArray(plan.groups)) return null;

      const opened = new Set();
      plan.groups.flat().forEach(token => {
        if (!token) return;
        const clean = getBaseSubjectName(token);
        // 폐강 확정 과목은 개설 목록에서 제외
        if (closedNorms.has(normalizeSubjectKey(clean)) || closedNorms.has(normalizeSubjectKey(token))) {
          return;
        }
        opened.add(clean);
        opened.add(String(token).trim());
      });
      return opened;
    }

    // 학년 간 데이터 간섭 및 강제 이동 원천 차단 (2학년과 3학년은 100% 완전 독립)
    function healAcademicYearData(activeYear) {
      // 2학년과 3학년 간 학생/데이터 강제 이동을 전면 중단하여 학년 간 간섭 0% 보장
      return;
    }

    // 과목의 실제 개설 학년 정확 판별 (편제표 및 이전 단계 학생 선택 데이터 기반)
    function getTrueGradeForSubject(subjectName, defaultGrade, currList, gData2, gData3) {
      if (!subjectName) return defaultGrade || '2학년';
      const norm = normalizeSubjectKey(subjectName);

      // 1. 편제표에 이미 등록되어 있는 학년이 있는지 최우선 확인
      if (currList && currList.length > 0) {
        const currMatch = currList.find(c => normalizeSubjectKey(c.subject) === norm);
        if (currMatch && currMatch.grade) {
          return currMatch.grade;
        }
      }

      // 2. 3학년 학생 vs 2학년 학생 선택 비율 확인
      const st3 = (gData3?.students || []);
      const st2 = (gData2?.students || []);

      let count3 = 0;
      let count2 = 0;

      st3.forEach(st => {
        if ([...(st.sem1 || []), ...(st.sem2 || [])].some(s => normalizeSubjectKey(s) === norm)) count3++;
      });
      st2.forEach(st => {
        if ([...(st.sem1 || []), ...(st.sem2 || [])].some(s => normalizeSubjectKey(s) === norm)) count2++;
      });

      if (count3 > 0 && count2 === 0) return '3학년';
      if (count2 > 0 && count3 === 0) return '2학년';
      if (count3 > count2) return '3학년';
      if (count2 > count3) return '2학년';

      // 3. 학생 번호/학급 정보 추적
      const allSt = [...st2, ...st3];
      let g3ClassCount = 0;
      let g2ClassCount = 0;
      allSt.forEach(st => {
        const hasSubj = [...(st.sem1 || []), ...(st.sem2 || [])].some(s => normalizeSubjectKey(s) === norm);
        if (hasSubj) {
          const cStr = String(st.classNum || '').trim();
          const nStr = String(st.studentNum || '').trim();
          const gStr = String(st.grade || '').trim();
          if (gStr.includes('3') || /^3-|^3반|^3\s*반/.test(cStr) || /^3\d{4}/.test(nStr) || /^3-/.test(nStr)) {
            g3ClassCount++;
          } else if (gStr.includes('2') || /^2-|^2반|^2\s*반/.test(cStr) || /^2\d{4}/.test(nStr) || /^2-/.test(nStr)) {
            g2ClassCount++;
          }
        }
      });

      if (g3ClassCount > g2ClassCount) return '3학년';
      if (g2ClassCount > g3ClassCount) return '2학년';

      return defaultGrade || '2학년';
    }
    // 2,3학년 수강신청 개설(미폐강) 과목 중 편제표 엑셀 누락 과목 대조 검사 (전학년 교차 검증 및 학년 오인식 차단)
    function checkMissingOpenSubjectsInCurriculum(curriculum) {
      const activeY = MultiState.activeYear || '2027';
      const currList = curriculum || getAllGradesCurriculum();
      if (!currList || currList.length === 0) {
        document.getElementById('allGradesMissingAlert')?.classList.add('hidden');
        return [];
      }

      // 학년 간 데이터 오염(2학년에 섞인 3학년 학생/과목) 선제적 정화
      healAcademicYearData(activeY);

      const acadData = getAcadData()[activeY] || {};
      const gData2 = acadData['2학년'] || {};
      const gData3 = acadData['3학년'] || {};

      const missing = [];
      const seenMissingKeys = new Set();

      ['2학년', '3학년'].forEach(gradeStr => {
        const gData = acadData[gradeStr];
        if (!gData || !gData.students || gData.students.length === 0) return;

        [1, 2].forEach(sem => {
          const closedList = gData.closedSubjects?.[sem] || [];
          const closedNorms = new Set(closedList.map(s => normalizeSubjectKey(s)));

          // 1. 2단계 그룹핑 배치안 개설 과목 수집
          const step2Opened = getStep2OpenedSubjects(activeY, gradeStr, sem);
          let openSubjectNames = [];

          if (step2Opened !== null && step2Opened.size > 0) {
            openSubjectNames = Array.from(step2Opened);
          } else {
            // 2단계가 없으면 1단계 수강신청 조사 과목 수집
            let semSubjects = (sem === 1 ? gData.sem1Subjects : gData.sem2Subjects) || [];
            if (!semSubjects || semSubjects.length === 0) {
              const semKey = (sem === 1 ? 'sem1' : 'sem2');
              const set = new Set();
              (gData.students || []).forEach(st => {
                (st[semKey] || []).forEach(s => { if (s && s.trim()) set.add(s.trim()); });
              });
              semSubjects = Array.from(set);
            }
            openSubjectNames = semSubjects.map(s => getBaseSubjectName(s));
          }

          // 폐강 과목 제외
          openSubjectNames = openSubjectNames.filter(s => s && !closedNorms.has(normalizeSubjectKey(s)));

          openSubjectNames.forEach(openSubj => {
            if (!openSubj) return;
            const norm = normalizeSubjectKey(openSubj);

            // 1. 편제표 전체(currList)에 이 과목이 이미 등록되어 있는지 확인
            const allCurrMatches = currList.filter(item => normalizeSubjectKey(item.subject) === norm);

            if (allCurrMatches.length > 0) {
              // 1-1. 해당 학년 및 학기에 완벽 일치하는 편제표 행이 있는 경우 -> 정상 등록됨!
              const hasExactMatch = allCurrMatches.some(item => 
                item.grade === gradeStr && item.semester === sem
              );
              if (hasExactMatch) return;

              // 1-2. 편제표에 '다른 학년'(예: 3학년 과목인데 2학년 조사에 섞여 있던 경우)으로 이미 등록되어 있는 경우:
              // 이미 편제표에 본래 학년으로 잘 등록되어 있으므로, 2학년 누락 과목으로 잘못 띄우지 않고 원천 배제!
              const belongsToOtherGrade = allCurrMatches.some(item => item.grade !== gradeStr);
              if (belongsToOtherGrade) {
                return;
              }

              // 1-3. 동일 학년 내에서 학기만 다른 경우 (예: 연간/학기 차이)
              const hasSameGradeOtherSem = allCurrMatches.some(item => item.grade === gradeStr);
              if (hasSameGradeOtherSem) {
                return;
              }
            }

            // 2. 편제표 전체 어디에도 없는 '진짜 누락 과목'인 경우:
            // 이전 단계(1·2단계 학생/그룹핑 데이터)를 바탕으로 이 과목의 실제 개설 학년(2학년 vs 3학년)을 정확히 판별
            const trueGrade = getTrueGradeForSubject(openSubj, gradeStr, currList, gData2, gData3);

            const missingKey = `${trueGrade}::${sem}::${norm}`;
            if (!seenMissingKeys.has(missingKey)) {
              seenMissingKeys.add(missingKey);
              missing.push({
                grade: trueGrade,
                semester: sem,
                subject: openSubj
              });
            }
          });
        });
      });

      renderMissingSubjectsAlert(missing);
      return missing;
    }

    function renderMissingSubjectsAlert(missingList) {
      const alertEl = document.getElementById('allGradesMissingAlert');
      const badgeEl = document.getElementById('allGradesMissingBadge');
      const container = document.getElementById('allGradesMissingListContainer');
      if (!alertEl || !container) return;

      window.currentMissingSubjectsList = missingList || [];

      if (!missingList || missingList.length === 0) {
        alertEl.classList.add('hidden');
        return;
      }

      if (badgeEl) badgeEl.textContent = `${missingList.length}건 누락`;
      container.innerHTML = '';

      missingList.forEach((item, idx) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'group inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-amber-100 active:bg-amber-200 border-2 border-amber-300 hover:border-amber-500 rounded-xl text-xs font-semibold text-amber-950 shadow-2xs transition-all cursor-pointer text-left';
        pill.title = `클릭하여 [${item.grade} ${item.semester}학기 ${item.subject}] 과목 편제표 추가 설정창 열기`;
        pill.innerHTML = `
          <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 group-hover:bg-amber-200 transition-colors border border-amber-200">${item.grade} ${item.semester}학기</span>
          <span class="font-bold text-slate-800 group-hover:text-amber-950">${escapeHtml(item.subject)}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500 group-hover:bg-amber-600 text-white font-extrabold flex items-center gap-0.5 shadow-2xs group-hover:scale-105 transition-transform">
            <span>➕</span>
            <span>추가</span>
          </span>
        `;
        pill.onclick = () => {
          window.openAddCourseModal({
            grade: item.grade,
            semester: item.semester,
            category: '선택',
            subject: item.subject,
            hours: 4,
            status: '개설',
            teacher: '',
            isFromMissing: true
          });
        };
        container.appendChild(pill);
      });

      alertEl.classList.remove('hidden');

      // Bind 일괄 추가 버튼
      const addBtn = document.getElementById('btnAddMissingToCurriculum');
      if (addBtn) {
        addBtn.onclick = () => {
          if (!missingList || missingList.length === 0) {
            alert('누락된 과목이 없습니다.');
            return;
          }
          window.openBatchAddMissingModal(missingList);
        };
      }
    }

    // ==========================================
    // BATCH ADD MISSING SUBJECTS MODAL LOGIC
    // ==========================================
    window.openBatchAddMissingModal = function(missingList) {
      const list = missingList || window.currentMissingSubjectsList || [];
      window.currentMissingSubjectsList = list;

      const badge = document.getElementById('batchAddMissingCountBadge');
      if (badge) badge.textContent = `${list.length}건`;

      // Populate teacher autocomplete datalist
      const datalist = document.getElementById('curriculumTeacherDatalist');
      if (datalist) {
        const curriculum = getAllGradesCurriculum();
        const teachers = new Set();
        curriculum.forEach(c => {
          if (c.teacher && c.teacher !== '폐강' && c.teacher !== '미배정') {
            teachers.add(c.teacher.trim());
          }
        });
        datalist.innerHTML = Array.from(teachers)
          .sort((a, b) => a.localeCompare(b, 'ko'))
          .map(t => `<option value="${escapeHtml(t)}"></option>`)
          .join('');
      }

      window.renderBatchAddMissingRows();

      const modal = document.getElementById('batchAddMissingModal');
      if (modal) modal.classList.remove('hidden');
    };

    window.closeBatchAddMissingModal = function() {
      const modal = document.getElementById('batchAddMissingModal');
      if (modal) modal.classList.add('hidden');
    };

    window.renderBatchAddMissingRows = function() {
      const tbody = document.getElementById('batchAddMissingTableBody');
      if (!tbody) return;
      const list = window.currentMissingSubjectsList || [];
      tbody.innerHTML = '';

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="p-6 text-center text-slate-400">누락된 과목이 없습니다.</td></tr>';
        return;
      }

      list.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-amber-50/50 transition-colors';
        tr.id = `batchAddRow_${index}`;

        // Grade options
        const gradeOpts = ['1학년', '2학년', '3학년'].map(g => 
          `<option value="${g}" ${item.grade === g ? 'selected' : ''}>${g}</option>`
        ).join('');

        // Semester options
        const semOpts = [1, 2].map(s => 
          `<option value="${s}" ${item.semester === s ? 'selected' : ''}>${s}학기</option>`
        ).join('');

        tr.innerHTML = `
          <td class="p-2.5 text-center">
            <input type="checkbox" class="batch-add-check w-3.5 h-3.5 rounded text-amber-600 border-slate-300 cursor-pointer" data-idx="${index}" checked onchange="window.updateBatchAddSubmitButton();" />
          </td>
          <td class="p-2 text-center border-r border-slate-200">
            <select class="batch-add-grade w-full px-2 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 outline-none">
              ${gradeOpts}
            </select>
          </td>
          <td class="p-2 text-center border-r border-slate-200">
            <select class="batch-add-semester w-full px-2 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 outline-none">
              ${semOpts}
            </select>
          </td>
          <td class="p-2 border-r border-slate-200">
            <input type="text" class="batch-add-subject w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-900 outline-none" value="${escapeHtml(item.subject)}" />
          </td>
          <td class="p-2 text-center border-r border-slate-200">
            <select class="batch-add-category w-full px-2 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-800 outline-none">
              <option value="선택" selected>선택</option>
              <option value="지정">지정</option>
            </select>
          </td>
          <td class="p-2 text-center border-r border-slate-200">
            <input type="number" class="batch-add-hours w-full px-2 py-1.5 text-xs font-black text-center border border-slate-300 rounded-lg bg-white text-indigo-700 outline-none" value="4" min="0.5" max="40" step="0.5" />
          </td>
          <td class="p-2 text-center border-r border-slate-200">
            <select class="batch-add-status w-full px-2 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-800 outline-none">
              <option value="개설" selected>개설</option>
              <option value="폐강">폐강</option>
            </select>
          </td>
          <td class="p-2 border-r border-slate-200">
            <input type="text" list="curriculumTeacherDatalist" class="batch-add-teacher w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-900 outline-none" placeholder="교사명 (선택)" />
          </td>
          <td class="p-2 text-center">
            <button type="button" onclick="window.openSingleFromBatch(${index})" class="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition cursor-pointer" title="단일 추가 화면으로 설정">
              개별설정
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      window.updateBatchAddSubmitButton();
    };

    window.openSingleFromBatch = function(index) {
      const item = window.currentMissingSubjectsList?.[index];
      if (!item) return;
      window.closeBatchAddMissingModal();
      window.openAddCourseModal({
        grade: item.grade,
        semester: item.semester,
        category: '선택',
        subject: item.subject,
        hours: 4,
        status: '개설',
        teacher: '',
        isFromMissing: true
      });
    };

    window.applyBatchAddDefaults = function() {
      const defCat = document.getElementById('batchAddDefaultCategory')?.value || '선택';
      const defHours = parseFloat(document.getElementById('batchAddDefaultHours')?.value || '4') || 4;

      const tbody = document.getElementById('batchAddMissingTableBody');
      if (!tbody) return;

      tbody.querySelectorAll('.batch-add-category').forEach(sel => sel.value = defCat);
      tbody.querySelectorAll('.batch-add-hours').forEach(inp => inp.value = defHours);
    };

    window.toggleBatchAddCheckAll = function(checked) {
      const tbody = document.getElementById('batchAddMissingTableBody');
      if (!tbody) return;
      tbody.querySelectorAll('.batch-add-check').forEach(chk => chk.checked = checked);
      window.updateBatchAddSubmitButton();
    };

    window.updateBatchAddSubmitButton = function() {
      const tbody = document.getElementById('batchAddMissingTableBody');
      const btnText = document.getElementById('batchAddSubmitBtnText');
      if (!tbody || !btnText) return;

      const count = tbody.querySelectorAll('.batch-add-check:checked').length;
      btnText.textContent = `선택한 ${count}개 과목 편제표에 일괄 추가`;

      const allCount = tbody.querySelectorAll('.batch-add-check').length;
      const checkAll = document.getElementById('batchAddCheckAll');
      if (checkAll) {
        checkAll.checked = (allCount > 0 && count === allCount);
        checkAll.indeterminate = (count > 0 && count < allCount);
      }
    };

    window.submitBatchAddMissingModal = function() {
      const tbody = document.getElementById('batchAddMissingTableBody');
      if (!tbody) return;
      const rows = tbody.querySelectorAll('tr');
      if (!rows || rows.length === 0) {
        alert('추가할 누락 과목이 없습니다.');
        return;
      }

      const checkedItems = [];
      rows.forEach(tr => {
        const chk = tr.querySelector('.batch-add-check');
        if (chk && chk.checked) {
          const grade = tr.querySelector('.batch-add-grade')?.value || '1학년';
          const semester = parseInt(tr.querySelector('.batch-add-semester')?.value || '1', 10);
          const subject = (tr.querySelector('.batch-add-subject')?.value || '').trim();
          const category = tr.querySelector('.batch-add-category')?.value || '선택';
          const hours = parseFloat(tr.querySelector('.batch-add-hours')?.value || '4') || 4;
          const status = tr.querySelector('.batch-add-status')?.value || '개설';
          const teacher = (tr.querySelector('.batch-add-teacher')?.value || '').trim();

          if (subject) {
            checkedItems.push({ grade, semester, subject, category, hours, status, teacher });
          }
        }
      });

      if (checkedItems.length === 0) {
        alert('선택된 과목이 없습니다. 편제표에 추가할 과목의 체크박스를 선택해주세요.');
        return;
      }

      const curriculum = getAllGradesCurriculum();
      let addedCount = 0;

      checkedItems.forEach((item, idx) => {
        const norm = normalizeSubjectKey(item.subject);
        const exists = curriculum.some(c => 
          c.grade === item.grade && c.semester === item.semester && 
          normalizeSubjectKey(c.subject) === norm
        );
        if (!exists) {
          curriculum.push({
            id: 'curr_missing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '_' + idx,
            grade: item.grade,
            semester: item.semester,
            category: item.category,
            subject: item.subject,
            baseSubject: getBaseSubjectName(item.subject),
            division: getSubjectDivision(item.subject) || '',
            hours: item.hours,
            originalTeacher: item.teacher,
            teacher: (item.status === '폐강' && !item.teacher) ? '폐강' : item.teacher,
            isModified: true,
            status: item.status
          });
          addedCount++;
        }
      });

      setAllGradesCurriculum(curriculum);
      applyStep2ToCurriculum(true, true);
      renderAllGradesDashboard();
      window.closeBatchAddMissingModal();

      alert(`✅ 누락 과목 [${addedCount}개]가 편제표에 성공적으로 일괄 추가되었습니다!\n전체 시수 현황 및 교사별 배정표에 반영되었습니다.`);
    };

    function applyStep2ToCurriculum(preserveEdits = true, silent = false) {
      const curriculum = getAllGradesCurriculum();
      if (curriculum.length === 0) {
        if (!silent) alert('대조할 기초데이터 과목이 없습니다. 먼저 기초데이터 엑셀을 업로드하거나 예시데이터를 불러오세요.');
        return;
      }

      let openedCount = 0;
      let closedCount = 0;
      let untouchedCount = 0;

      curriculum.forEach(item => {
        // 지정 과목은 항상 개설
        if (item.category === '지정' || item.category === '학교지정') {
          item.status = '개설';
          if (item.teacher === '폐강') {
            item.teacher = item.originalTeacher || '';
          }
          openedCount++;
          return;
        }

        // 1학년은 기본 개설
        if (item.grade === '1학년') {
          item.status = '개설';
          if (item.teacher === '폐강') {
            item.teacher = item.originalTeacher || '';
          }
          openedCount++;
          return;
        }

        const normSubj = normalizeSubjectKey(item.subject);
        const gData = getAcadData()[MultiState.activeYear]?.[item.grade];
        const sem = item.semester;

        // 해당 학년/학기의 1단계 수강신청 조사 과목 목록 수집
        let semSubjs = (sem === 1 ? gData?.sem1Subjects : gData?.sem2Subjects) || [];
        if (!semSubjs || semSubjs.length === 0) {
          const semKey = (sem === 1 ? 'sem1' : 'sem2');
          const set = new Set();
          (gData?.students || []).forEach(st => {
            (st[semKey] || []).forEach(s => { if (s && s.trim()) set.add(s.trim()); });
          });
          semSubjs = Array.from(set);
        }

        // 해당 학년/학기의 2단계 그룹핑 개설 과목 세트
        const openedSet = getStep2OpenedSubjects(MultiState.activeYear, item.grade, sem);

        if (openedSet !== null) {
          // 2단계 결과가 존재하는 경우:
          // 2단계 배치안 그룹에 편성된 과목인지 엄격한 완전 일치 비교
          const isOpened = [...openedSet].some(s => normalizeSubjectKey(s) === normSubj);

          if (isOpened) {
            item.status = '개설';
            if (item.teacher === '폐강') {
              item.teacher = item.originalTeacher || '';
            }
            openedCount++;
          } else {
            // 2단계 개설 과목에 없거나 앞의 작업에 처음부터 존재하지 않았던 과목은 폐강 처리
            item.status = '폐강';
            if (!preserveEdits || !item.isModified) {
              item.teacher = '폐강';
            }
            closedCount++;
          }
        } else {
          // 2단계 결과가 아직 없는 학년/학기:
          // 1단계 수강신청 조사 데이터가 존재하는지 확인
          const hasSurveyData = semSubjs.length > 0 || (gData?.students && gData.students.length > 0);
          if (hasSurveyData) {
            // 1단계 조사 목록에 존재하는지 엄격히 확인
            const inSurvey = semSubjs.some(s => normalizeSubjectKey(s) === normSubj);
            const closedList = gData?.closedSubjects?.[sem] || [];
            const isClosedInStep1 = closedList.some(s => normalizeSubjectKey(s) === normSubj);

            if (!inSurvey || isClosedInStep1) {
              // 1단계 조사 목록에 처음부터 없었거나, 1단계에서 폐강된 과목은 자동 폐강 처리
              item.status = '폐강';
              if (!preserveEdits || !item.isModified) {
                item.teacher = '폐강';
              }
              closedCount++;
            } else {
              // 1단계 조사에 존재하고 폐강되지 않은 과목은 개설 상태 유지
              item.status = '개설';
              if (item.teacher === '폐강') {
                item.teacher = item.originalTeacher || '';
              }
              openedCount++;
            }
          } else {
            // 1단계, 2단계 데이터가 아예 없는 학년
            untouchedCount++;
          }
        }
      });

      setAllGradesCurriculum(curriculum);
      renderAllGradesDashboard();

      if (!silent) {
        let msg = `✅ 2단계 선택과목 개설 결과가 대조 적용되었습니다!\n- 개설 과목: ${openedCount}개\n- 폐강(미개설) 과목: ${closedCount}개`;
        if (untouchedCount > 0) {
          msg += `\n(참고: 수강신청 데이터가 없는 학년의 과목 ${untouchedCount}개는 기존 상태를 유지했습니다.)`;
        }
        alert(msg);
      }
    }

    function parseAllGradesExcel(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // 1. 스마트 시트 자동 감지: 과목 데이터가 들어있는 최적의 시트를 탐색
          let targetSheetName = workbook.SheetNames[0];
          let bestScore = -1;

          for (const sName of workbook.SheetNames) {
            let score = 0;
            if (/기초데이터|과목|편제|curriculum/i.test(sName)) score += 50;
            if (/상세|detail|배정/i.test(sName)) score += 40;

            const ws = workbook.Sheets[sName];
            const sampleJson = XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' });
            if (sampleJson && sampleJson.length > 0) {
              const headerRow = sampleJson[0].map(h => String(h || '').trim());
              const hasSubj = headerRow.some(h => /과목명|교과목명|과목|교과목/i.test(h));
              const hasHours = headerRow.some(h => /시수|hours/i.test(h));
              const hasGrade = headerRow.some(h => /학년|grade/i.test(h));
              const hasSem = headerRow.some(h => /학기|sem/i.test(h));
              const hasTeacher = headerRow.some(h => /교사|teacher|담당/i.test(h));

              if (hasSubj) score += 30;
              if (hasHours) score += 20;
              if (hasGrade) score += 15;
              if (hasSem) score += 15;
              if (hasTeacher) score += 15;
            }

            if (score > bestScore) {
              bestScore = score;
              targetSheetName = sName;
            }
          }

          const worksheet = workbook.Sheets[targetSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (!rawRows || rawRows.length === 0) {
            alert('엑셀 파일에 유효한 데이터가 없습니다.');
            return;
          }

          const parsedCurriculum = [];

          rawRows.forEach((row, idx) => {
            const keys = Object.keys(row);

            // Find matching column keys
            const semKey = keys.find(k => /학기|semester/i.test(k));
            const gradeKey = keys.find(k => /학년|grade/i.test(k));
            const catKey = keys.find(k => /구분|이수구분|지정|선택/i.test(k));
            const subjKey = keys.find(k => /과목명|교과목명|과목|교과목/i.test(k));
            
            // '총 시수', '총시수' 우선 탐색, 없으면 일반 '시수' 인식
            const hoursKey = keys.find(k => /총s*시수|총시수|totals*hours/i.test(k)) || keys.find(k => /^시수$/i.test(k));
            const teacherKey = keys.find(k => /담당교사|교사명|담당|교사|teacher/i.test(k));

            // 개설상태 및 원본 교사 복원 열
            const statusKey = keys.find(k => /개설상태|개설s*상태|상태|status/i.test(k));
            const origTeacherKey = keys.find(k => /최초원래교사|원래교사|원래s*담당|originalteacher/i.test(k));
            const modKey = keys.find(k => /수정여부|수정s*여부|ismodified/i.test(k));

            const rawSubjVal = String(row[subjKey] || row['과목명'] || '').trim();
            if (!rawSubjVal) return; // Skip empty rows

            // 별표나 각주 기호(*, ※, † 등)를 깔끔하게 정돈한 과목명
            const subjVal = rawSubjVal.replace(SUBJECT_SPECIAL_CHARS_REGEX, '').trim() || rawSubjVal;

            // 1. 학기 파싱
            let semNum = 1;
            const semRaw = String(row[semKey] || row['학기'] || '1').trim();
            const semMatch = semRaw.match(/[12]/);
            if (semMatch && semMatch[0] === '2') semNum = 2;
            else semNum = 1;

            // 2. 학년 파싱
            let gradeStr = '2학년';
            const gradeRaw = String(row[gradeKey] || row['학년'] || '').trim();
            const gradeMatch = gradeRaw.match(/[123]/);
            if (gradeMatch) {
              gradeStr = gradeMatch[0] + '학년';
            }

            // 3. 구분 파싱
            let catStr = (gradeStr === '1학년') ? '지정' : '선택';
            const catRaw = String(row[catKey] || row['구분'] || '').trim();
            if (catRaw.includes('선택') || catRaw.includes('진로') || catRaw.includes('융합') || catRaw.includes('자율') || catRaw.includes('전문')) {
              catStr = '선택';
            } else if (catRaw.includes('지정') || catRaw.includes('필수') || catRaw.includes('공통')) {
              catStr = '지정';
            }

            // 4. 총 시수 파싱
            const hoursCellVal = String((hoursKey ? row[hoursKey] : '') || row['총 시수'] || row['총시수'] || row['시수'] || '0');
            const hoursRaw = parseFloat(hoursCellVal.replace(/[^0-9.]/g, '')) || 0;

            // 5. 담당교사 및 수정/폐강 상태 파싱 (재업로드 시 완벽 복원)
            const teacherVal = String((teacherKey ? row[teacherKey] : '') || row['담당교사'] || '').trim();
            const statusRaw = String((statusKey ? row[statusKey] : '') || row['개설상태'] || '').trim();
            const origTeacherRaw = String((origTeacherKey ? row[origTeacherKey] : '') || row['최초원래교사'] || '').trim();
            const modRaw = String((modKey ? row[modKey] : '') || row['수정여부'] || '').trim();

            const isClosed = (statusRaw === '폐강' || teacherVal === '폐강');
            const statusVal = isClosed ? '폐강' : '개설';
            const originalTeacherVal = origTeacherRaw || teacherVal;
            const isModifiedVal = (modRaw === '수정됨') || (teacherVal !== originalTeacherVal) || isClosed;

            // 6. 반 구분 및 분반 정보 추출 (엑셀 열 또는 과목명 접미사)
            const baseSubj = getBaseSubjectName(subjVal);
            const divKey = keys.find(k => /반\s*구분|분반|학급|division/i.test(k));
            let division = String((divKey ? row[divKey] : '') || '').trim();
            if (!division || division === '-') {
              division = getSubjectDivision(subjVal);
            }

            parsedCurriculum.push({
              id: 'curr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '_' + idx,
              semester: semNum,
              grade: gradeStr,
              category: catStr,
              subject: subjVal,
              baseSubject: baseSubj,
              division: division,
              hours: hoursRaw,
              originalTeacher: originalTeacherVal,
              teacher: isClosed ? '폐강' : teacherVal,
              isModified: isModifiedVal,
              status: statusVal
            });
          });

          if (parsedCurriculum.length === 0) {
            alert('인식 가능한 과목 데이터가 없습니다. 열 제목(학기, 학년, 구분, 과목명, 총 시수, 담당교사)을 확인해주세요.');
            return;
          }

          // 재업로드된 파일에 이미 수정된 교사/폐강 정보가 있는지 감지
          const hasPreservedEdits = parsedCurriculum.some(c => c.isModified || c.status === '폐강' || (c.teacher && c.teacher !== c.originalTeacher));

          setAllGradesCurriculum(parsedCurriculum);
          applyStep2ToCurriculum(hasPreservedEdits, true); // preserveEdits if uploaded file already had custom edits
          const missing = checkMissingOpenSubjectsInCurriculum(parsedCurriculum);
          renderAllGradesDashboard();

          const closedCount = parsedCurriculum.filter(c => c.status === '폐강').length;
          const assignedCount = parsedCurriculum.filter(c => c.teacher && c.teacher !== '폐강' && c.teacher !== '미배정').length;

          let successMsg = `✅ [시트: ${targetSheetName}]에서 총 [${parsedCurriculum.length}개] 과목 기초데이터를 성공적으로 불러왔습니다!`;
          if (hasPreservedEdits) {
            successMsg += `\n(수정 반영 내역 보존: 담당교사 배정 ${assignedCount}건, 폐강 ${closedCount}건이 유지되었습니다.)`;
          }
          if (missing.length > 0) {
            successMsg += `\n\n⚠️ [편제표 누락 과목 확인]\n2·3학년 수강신청에서 개설된 과목 중 기초데이터 엑셀에 없는 과목이 [${missing.length}개] 발견되었습니다.\n상단 주황색 안내 상자에서 누락 과목을 확인하거나 [일괄 추가]할 수 있습니다.`;
          }
          alert(successMsg);
        } catch (err) {
          console.error('parseAllGradesExcel error:', err);
          alert('엑셀 파일을 읽는 도중 오류가 발생했습니다: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }

    function loadSampleCurriculumData() {
      const parsedCurriculum = sampleCurriculumData.map((item, idx) => ({
        id: 'curr_sample_' + Date.now() + '_' + idx,
        semester: item.semester,
        grade: item.grade,
        category: item.category,
        subject: item.subject,
        baseSubject: getBaseSubjectName(item.subject),
        division: getSubjectDivision(item.subject),
        hours: item.hours,
        originalTeacher: item.teacher,
        teacher: item.teacher,
        isModified: false,
        status: '개설'
      }));

      setAllGradesCurriculum(parsedCurriculum);
      applyStep2ToCurriculum(false, true);
      checkMissingOpenSubjectsInCurriculum(parsedCurriculum);
      renderAllGradesDashboard();
      alert(`💡 테스트용 예시 기초데이터(${parsedCurriculum.length}개 과목)를 불러왔습니다!`);
    }

    window.updateCurriculumItemSubject = function(itemId, newSubject) {
      const curriculum = getAllGradesCurriculum();
      const item = curriculum.find(c => c.id === itemId);
      if (!item) return;

      const trimmed = (newSubject || '').trim();
      if (!trimmed) {
        alert('과목명은 비워둘 수 없습니다.');
        renderAllGradesCurriculumTable();
        return;
      }

      const prevSubj = item.subject;
      item.subject = trimmed;
      item.baseSubject = getBaseSubjectName(trimmed);
      item.division = getSubjectDivision(trimmed);
      item.isModified = true;

      // 변경된 과목명 기준으로 수강신청 결과와 재대조하여 개설/폐강 상태 갱신
      if (item.category === '선택' || item.category === '학생선택') {
        const normSubj = normalizeSubjectKey(trimmed);
        const openedSet = getStep2OpenedSubjects(MultiState.activeYear, item.grade, item.semester);
        if (openedSet !== null) {
          const isOpened = [...openedSet].some(s => normalizeSubjectKey(s) === normSubj);
          if (isOpened) {
            item.status = '개설';
            if (item.teacher === '폐강') item.teacher = item.originalTeacher || '';
          } else {
            item.status = '폐강';
            item.teacher = '폐강';
          }
        } else {
          const gData = getAcadData()[MultiState.activeYear]?.[item.grade];
          let semSubjs = (item.semester === 1 ? gData?.sem1Subjects : gData?.sem2Subjects) || [];
          if (!semSubjs || semSubjs.length === 0) {
            const semKey = (item.semester === 1 ? 'sem1' : 'sem2');
            const set = new Set();
            (gData?.students || []).forEach(st => {
              (st[semKey] || []).forEach(s => { if (s && s.trim()) set.add(s.trim()); });
            });
            semSubjs = Array.from(set);
          }
          if (semSubjs.length > 0) {
            const inSurvey = semSubjs.some(s => normalizeSubjectKey(s) === normSubj);
            const closedList = gData?.closedSubjects?.[item.semester] || [];
            const isClosed = closedList.some(s => normalizeSubjectKey(s) === normSubj);
            if (!inSurvey || isClosed) {
              item.status = '폐강';
              item.teacher = '폐강';
            } else {
              item.status = '개설';
              if (item.teacher === '폐강') item.teacher = item.originalTeacher || '';
            }
          }
        }
      }

      setAllGradesCurriculum(curriculum);
      renderAllGradesDashboard(false);
      console.log(`✅ 과목명 변경: [${prevSubj}] ➔ [${trimmed}] (상태: ${item.status})`);
    };

    window.updateCurriculumItemHours = function(itemId, newHours) {
      const curriculum = getAllGradesCurriculum();
      const item = curriculum.find(c => c.id === itemId);
      if (!item) return;

      const parsedHours = parseFloat(newHours);
      if (isNaN(parsedHours) || parsedHours < 0) {
        alert('시수는 0 이상의 유효한 숫자를 입력해주세요.');
        renderAllGradesCurriculumTable();
        return;
      }

      item.hours = parsedHours;
      item.isModified = true;

      setAllGradesCurriculum(curriculum);
      renderAllGradesDashboard(false);
      console.log(`✅ [${item.subject}] 총 시수 변경: ${parsedHours}시간`);
    };

    window.updateTeacherAssignment = function(itemId, newTeacher) {
      const curriculum = getAllGradesCurriculum();
      const item = curriculum.find(c => c.id === itemId);
      if (!item) return;

      const trimmed = (newTeacher || '').trim();
      item.teacher = trimmed;
      item.isModified = (trimmed !== (item.originalTeacher || ''));

      if (trimmed === '폐강') {
        item.status = '폐강';
      } else if (item.status === '폐강' && trimmed !== '') {
        item.status = '개설';
      }

      setAllGradesCurriculum(curriculum);
      renderAllGradesDashboard(false); // don't redraw entire inputs to preserve user focus
      window.updateUnassignedTeacherBadgeState();
    };

    window.resetCurriculumItemTeacher = function(itemId) {
      const curriculum = getAllGradesCurriculum();
      const item = curriculum.find(c => c.id === itemId);
      if (!item) return;

      item.teacher = item.originalTeacher || '';
      item.isModified = false;
      if (item.teacher !== '폐강') {
        item.status = '개설';
      }

      setAllGradesCurriculum(curriculum);
      renderAllGradesDashboard();
      window.updateUnassignedTeacherBadgeState();
    };

    // ==========================================
    // CURRICULUM DIVISION & GRADE CLASS COUNT MANAGEMENT
    // ==========================================
    function getGradeClassCounts() {
      if (!MultiState.gradeClassCounts) {
        MultiState.gradeClassCounts = { '1학년': 2, '2학년': 2, '3학년': 2 };
      }
      return MultiState.gradeClassCounts;
    }

    function updateGradeClassCountBadge() {
      const badge = document.getElementById('gradeClassCountSummaryBadge');
      if (!badge) return;
      const counts = getGradeClassCounts();
      badge.textContent = `1학년 ${counts['1학년']}반, 2학년 ${counts['2학년']}반, 3학년 ${counts['3학년']}반`;
    }

    window.openGradeClassCountModal = function() {
      const counts = getGradeClassCounts();
      const inp1 = document.getElementById('gradeClassCount1');
      const inp2 = document.getElementById('gradeClassCount2');
      const inp3 = document.getElementById('gradeClassCount3');
      if (inp1) inp1.value = counts['1학년'] || 2;
      if (inp2) inp2.value = counts['2학년'] || 2;
      if (inp3) inp3.value = counts['3학년'] || 2;
      const modal = document.getElementById('gradeClassCountModal');
      if (modal) modal.classList.remove('hidden');
    };

    window.closeGradeClassCountModal = function() {
      const modal = document.getElementById('gradeClassCountModal');
      if (modal) modal.classList.add('hidden');
    };

    window.saveGradeClassCounts = function(applyBatch = false) {
      const c1 = parseInt(document.getElementById('gradeClassCount1')?.value || 2, 10);
      const c2 = parseInt(document.getElementById('gradeClassCount2')?.value || 2, 10);
      const c3 = parseInt(document.getElementById('gradeClassCount3')?.value || 2, 10);

      MultiState.gradeClassCounts = {
        '1학년': Math.max(1, c1),
        '2학년': Math.max(1, c2),
        '3학년': Math.max(1, c3)
      };
      saveAllState();
      updateGradeClassCountBadge();
      window.closeGradeClassCountModal();

      if (applyBatch) {
        window.batchSetDivisions('지정12');
      } else {
        alert(`✅ 학년별 학급 수가 저장되었습니다:\n- 1학년: ${MultiState.gradeClassCounts['1학년']}개 반\n- 2학년: ${MultiState.gradeClassCounts['2학년']}개 반\n- 3학년: ${MultiState.gradeClassCounts['3학년']}개 반`);
      }
    };

    window.cycleCurriculumDivision = function(itemId) {
      const curriculum = getAllGradesCurriculum();
      const item = curriculum.find(c => c.id === itemId);
      if (!item) return;

      const classCounts = getGradeClassCounts();
      const maxClasses = parseInt(classCounts[item.grade] || 2, 10);

      // 순환 목록: 선택 ➔ 1반 ➔ 2반 (➔ ... maxClasses반) ➔ 분반 ➔ 선택
      const options = ['선택'];
      for (let i = 1; i <= maxClasses; i++) {
        options.push(`${i}반`);
      }
      options.push('분반');

      let current = (item.division || (item.category === '선택' ? '선택' : '1반')).trim();
      let curIdx = options.indexOf(current);
      if (curIdx === -1) {
        if (current.startsWith('분반')) curIdx = options.indexOf('분반');
        else curIdx = 0;
      }

      const nextIdx = (curIdx + 1) % options.length;
      item.division = options[nextIdx];
      item.isModified = true;
      setAllGradesCurriculum(curriculum);
      renderAllGradesCurriculumTable();
      renderAllGradesTeacherSummary();
    };

    window.batchSetDivisions = function(type) {
      const curriculum = getAllGradesCurriculum();
      if (curriculum.length === 0) return;

      const classCounts = getGradeClassCounts();

      if (type === '선택') {
        let count = 0;
        curriculum.forEach(c => {
          if (c.category === '선택' || c.category === '학생선택') {
            c.division = '선택';
            c.isModified = true;
            count++;
          }
        });
        setAllGradesCurriculum(curriculum);
        renderAllGradesCurriculumTable();
        renderAllGradesTeacherSummary();
        alert(`✅ 모든 선택과목 (${count}개)의 반 구분이 [선택]으로 일괄 설정되었습니다.`);
      } else if (type === '지정12') {
        let count = 0;
        const groups = {};
        curriculum.forEach(c => {
          if (c.category === '지정' || c.category === '학교지정') {
            const k = `${c.semester}_${c.grade}_${normalizeSubjectKey(c.subject)}`;
            if (!groups[k]) groups[k] = [];
            groups[k].push(c);
          }
        });

        Object.values(groups).forEach(grp => {
          const gGrade = grp[0].grade;
          const maxClasses = parseInt(classCounts[gGrade] || 2, 10);

          if (grp.length > maxClasses) {
            // 학급 수를 초과하는 경우: 분반1, 분반2, 분반3... 자동 부여
            grp.forEach((c, idx) => {
              c.division = `분반${idx + 1}`;
              c.isModified = true;
              count++;
            });
          } else {
            // 학급 수 이내인 경우: 1반, 2반, 3반... 순환 부여
            grp.forEach((c, idx) => {
              c.division = `${(idx % maxClasses) + 1}반`;
              c.isModified = true;
              count++;
            });
          }
        });

        setAllGradesCurriculum(curriculum);
        renderAllGradesCurriculumTable();
        renderAllGradesTeacherSummary();
        alert(`✅ 모든 학교지정과목 (${count}개)의 반 구분이 학급 수(1학년 ${classCounts['1학년']}반, 2학년 ${classCounts['2학년']}반, 3학년 ${classCounts['3학년']}반) 기준 [1반/2반/분반]으로 자동 설정되었습니다.`);
      }
    };

    // ==========================================
    // UNASSIGNED TEACHER FILTER & BADGE LOGIC
    // ==========================================
    window._isUnassignedTeacherFilterActive = false;

    window.toggleUnassignedTeachersFilter = function() {
      window._isUnassignedTeacherFilterActive = !window._isUnassignedTeacherFilterActive;
      const selectEl = document.getElementById('allGradesFilterTeacherAssigned');
      if (selectEl) {
        selectEl.value = window._isUnassignedTeacherFilterActive ? 'unassigned' : 'all';
      }
      renderAllGradesCurriculumTable();
      window.updateUnassignedTeacherBadgeState();
    };

    window.updateUnassignedTeacherBadgeState = function() {
      const curriculum = getAllGradesCurriculum();
      const unassignedCourses = curriculum.filter(c => {
        if (c.status === '폐강') return false;
        const t = (c.teacher || '').trim();
        return !t || t === '미지정' || t === '미배정' || t === '-' || t === '없음';
      });
      const unassignedCount = unassignedCourses.length;

      const unassignedBtn = document.getElementById('btnFilterUnassignedTeachers');
      const unassignedCountSpan = document.getElementById('unassignedTeachersCountBadge');
      if (unassignedBtn) {
        if (window._isUnassignedTeacherFilterActive) {
          unassignedBtn.className = 'text-xs px-2.5 py-0.5 rounded-full font-black bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 shadow-xs flex items-center gap-1.5 cursor-pointer transition select-none ring-2 ring-rose-300';
          unassignedBtn.innerHTML = `<span>🔍 담당 교사 미지정만 표시 중</span> <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-rose-800 font-black">${unassignedCount}개</span> <span class="text-[10px] opacity-80 hover:opacity-100 font-normal ml-0.5">✕ 필터 해제</span>`;
          unassignedBtn.title = '클릭하여 필터를 해제하고 전체 과목을 표시합니다.';
        } else if (unassignedCount > 0) {
          unassignedBtn.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition select-none ring-1 ring-amber-200';
          unassignedBtn.innerHTML = `<span>⚠️ 담당 교사 미지정</span> <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-600 text-white font-black">${unassignedCount}개</span>`;
          unassignedBtn.title = `클릭하여 담당 교사가 지정되지 않은 ${unassignedCount}개 과목만 필터링합니다.`;
        } else {
          unassignedBtn.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs flex items-center gap-1.5 select-none';
          unassignedBtn.innerHTML = `<span>✅ 담당 교사 전원 지정 완료</span> <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-black">0개</span>`;
          unassignedBtn.title = '모든 개설 과목에 담당 교사가 배정되었습니다.';
        }
      }
    };

    window.toggleCurriculumItemStatus = function(itemId) {
      const curriculum = getAllGradesCurriculum();
      const item = curriculum.find(c => c.id === itemId);
      if (!item) return;

      if (item.status === '개설') {
        item.status = '폐강';
        item.teacher = '폐강';
        item.isModified = true;
      } else {
        item.status = '개설';
        item.teacher = item.originalTeacher || '';
        item.isModified = false;
      }

      setAllGradesCurriculum(curriculum);
      renderAllGradesDashboard();
    };

    window.deleteCurriculumItem = function(itemId) {
      const curriculum = getAllGradesCurriculum();
      const item = curriculum.find(c => c.id === itemId);
      if (!item) return;

      const confirmMsg = `⚠️ [${item.grade} ${item.semester}학기] '${item.subject}' 과목을 편제표에서 완전히 삭제하시겠습니까?\n\n- 담당 교사: ${item.teacher || '미배정'}\n- 주당 시수: ${item.hours}시간\n\n※ 삭제된 과목은 교사별 시수 집계 및 대시보드에서 즉시 제외됩니다.`;
      if (!confirm(confirmMsg)) return;

      const updated = curriculum.filter(c => c.id !== itemId);
      setAllGradesCurriculum(updated);
      renderAllGradesDashboard();
      console.log(`🗑️ 과목 삭제 완료: [${item.grade} ${item.semester}학기] ${item.subject} (${itemId})`);
    };

    window.openAddCourseModal = function(initialData = null) {
      const gradeSelect = document.getElementById('modalAddCourseGrade');
      const semSelect = document.getElementById('modalAddCourseSemester');
      const catSelect = document.getElementById('modalAddCourseCategory');
      const subjInput = document.getElementById('modalAddCourseSubject');
      const teacherInput = document.getElementById('modalAddCourseTeacher');
      const hoursInput = document.getElementById('modalAddCourseHours');
      const statusSelect = document.getElementById('modalAddCourseStatus');
      const titleEl = document.getElementById('modalAddCourseTitle');
      const subTitleEl = document.getElementById('modalAddCourseSubtitle');

      if (initialData) {
        if (gradeSelect) gradeSelect.value = initialData.grade || '1학년';
        if (semSelect) semSelect.value = String(initialData.semester || '1');
        if (catSelect) catSelect.value = initialData.category || '선택';
        if (subjInput) subjInput.value = initialData.subject || '';
        if (hoursInput) hoursInput.value = initialData.hours != null ? initialData.hours : '4';
        if (statusSelect) statusSelect.value = initialData.status || '개설';
        if (teacherInput) teacherInput.value = initialData.teacher || '';

        if (titleEl) {
          titleEl.innerHTML = initialData.isFromMissing
            ? '<span>누락 과목 편제표 추가</span> <span class="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">수강신청 연동</span>'
            : '새 과목 직접 추가';
        }
        if (subTitleEl) {
          subTitleEl.textContent = initialData.isFromMissing
            ? '수강신청 개설 과목 중 누락된 과목을 편제표에 추가합니다. 과목 정보 및 총 시수를 확인하세요.'
            : '편제표에 새로운 과목을 등록합니다. 학년, 학기, 과목명 등을 입력하세요.';
        }
      } else {
        const filterGrade = document.getElementById('allGradesFilterGrade')?.value;
        const filterSem = document.getElementById('allGradesFilterSemester')?.value;
        const filterCat = document.getElementById('allGradesFilterCategory')?.value;

        if (gradeSelect && filterGrade && filterGrade !== 'all') {
          gradeSelect.value = filterGrade;
        } else if (gradeSelect) {
          gradeSelect.value = '1학년';
        }
        if (semSelect && filterSem && filterSem !== 'all') {
          semSelect.value = filterSem;
        } else if (semSelect) {
          semSelect.value = '1';
        }
        if (catSelect && filterCat && filterCat !== 'all') {
          catSelect.value = filterCat;
        } else if (catSelect) {
          catSelect.value = '선택';
        }

        if (subjInput) subjInput.value = '';
        if (teacherInput) teacherInput.value = '';
        if (hoursInput) hoursInput.value = '4';
        if (statusSelect) statusSelect.value = '개설';

        if (titleEl) titleEl.textContent = '새 과목 직접 추가';
        if (subTitleEl) subTitleEl.textContent = '편제표에 새로운 과목을 등록합니다. 학년, 학기, 과목명 등을 입력하세요.';
      }

      // Populate teacher autocomplete datalist
      const datalist = document.getElementById('curriculumTeacherDatalist');
      if (datalist) {
        const curriculum = getAllGradesCurriculum();
        const teachers = new Set();
        curriculum.forEach(c => {
          if (c.teacher && c.teacher !== '폐강' && c.teacher !== '미배정') {
            teachers.add(c.teacher.trim());
          }
        });
        datalist.innerHTML = Array.from(teachers)
          .sort((a, b) => a.localeCompare(b, 'ko'))
          .map(t => `<option value="${escapeHtml(t)}"></option>`)
          .join('');
      }

      const modal = document.getElementById('addCourseModal');
      if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
          if (initialData?.subject) {
            hoursInput?.focus();
            hoursInput?.select();
          } else {
            subjInput?.focus();
          }
        }, 60);
      }
    };

    window.closeAddCourseModal = function() {
      const modal = document.getElementById('addCourseModal');
      if (modal) modal.classList.add('hidden');
      const titleEl = document.getElementById('modalAddCourseTitle');
      const subTitleEl = document.getElementById('modalAddCourseSubtitle');
      if (titleEl) titleEl.textContent = '새 과목 직접 추가';
      if (subTitleEl) subTitleEl.textContent = '편제표에 새로운 과목을 등록합니다. 학년, 학기, 과목명 등을 입력하세요.';
    };

    window.submitAddCourseModal = function() {
      const grade = document.getElementById('modalAddCourseGrade')?.value || '1학년';
      const semester = parseInt(document.getElementById('modalAddCourseSemester')?.value || '1', 10);
      const category = document.getElementById('modalAddCourseCategory')?.value || '선택';
      const subjectInput = document.getElementById('modalAddCourseSubject');
      const subject = (subjectInput?.value || '').trim();
      const hours = parseFloat(document.getElementById('modalAddCourseHours')?.value || '4') || 4;
      const status = document.getElementById('modalAddCourseStatus')?.value || '개설';
      const teacher = (document.getElementById('modalAddCourseTeacher')?.value || '').trim();
      const keepOpen = document.getElementById('modalAddCourseKeepOpen')?.checked;

      if (!subject) {
        alert('과목명을 입력해주세요.');
        subjectInput?.focus();
        return;
      }

      if (hours <= 0) {
        alert('주당 총 시수는 0보다 커야 합니다.');
        return;
      }

      const curriculum = getAllGradesCurriculum();

      // Check for duplicates in same grade & semester
      const normSubj = normalizeSubjectKey(subject);
      const isDuplicate = curriculum.some(c => 
        c.grade === grade && c.semester === semester && normalizeSubjectKey(c.subject) === normSubj
      );
      if (isDuplicate) {
        if (!confirm(`[${grade} ${semester}학기]에 '${subject}' 과목이 이미 편제표에 등록되어 있습니다.\n그래도 추가하시겠습니까? (분반 과목 등)`)) {
          return;
        }
      }

      const newItem = {
        id: 'curr_manual_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        grade,
        semester,
        category,
        subject,
        baseSubject: getBaseSubjectName(subject),
        division: getSubjectDivision(subject) || '',
        hours,
        originalTeacher: teacher,
        teacher: (status === '폐강' && !teacher) ? '폐강' : teacher,
        isModified: true,
        status
      };

      curriculum.push(newItem);
      setAllGradesCurriculum(curriculum);
      applyStep2ToCurriculum(true, true);

      // Reset filters so that the newly added course is immediately visible in the table
      const filterGrade = document.getElementById('allGradesFilterGrade');
      const filterSem = document.getElementById('allGradesFilterSemester');
      const filterStatus = document.getElementById('allGradesFilterStatus');
      const searchInput = document.getElementById('allGradesCourseSearchInput');

      if (filterGrade && filterGrade.value !== 'all' && filterGrade.value !== grade) {
        filterGrade.value = 'all';
      }
      if (filterSem && filterSem.value !== 'all' && filterSem.value !== String(semester)) {
        filterSem.value = 'all';
      }
      if (filterStatus && filterStatus.value !== 'all' && filterStatus.value !== status) {
        filterStatus.value = 'all';
      }
      if (searchInput && searchInput.value) {
        searchInput.value = '';
      }

      renderAllGradesDashboard();

      console.log(`➕ 새 과목 추가 완료: [${grade} ${semester}학기] ${subject} (${hours}h, 담당: ${teacher || '미배정'})`);

      if (keepOpen) {
        subjectInput.value = '';
        const teacherEl = document.getElementById('modalAddCourseTeacher');
        if (teacherEl) teacherEl.value = '';
        subjectInput.focus();
        alert(`✅ [${grade} ${semester}학기] '${subject}' 과목이 추가되었습니다!\n계속해서 다음 과목을 추가하실 수 있습니다.`);
      } else {
        window.closeAddCourseModal();
      }
    };

    window.toggleCurriculumItemCategory = function(itemId) {
      const curriculum = getAllGradesCurriculum();
      const item = curriculum.find(c => c.id === itemId);
      if (!item) return;

      const wasChoice = (item.category === '선택' || item.category === '학생선택');
      item.category = wasChoice ? '지정' : '선택';
      item.isModified = true;

      // 만약 '선택'으로 바꾼 경우, 2단계 대조를 실행하여 미개설 과목이면 자동 폐강 처리
      if (item.category === '선택') {
        const normSubj = normalizeSubjectKey(item.subject);
        const openedSet = getStep2OpenedSubjects(MultiState.activeYear, item.grade, item.semester);
        if (openedSet !== null) {
          const isOpened = [...openedSet].some(s => normalizeSubjectKey(s) === normSubj);
          if (!isOpened) {
            item.status = '폐강';
            item.teacher = '폐강';
          }
        } else {
          // 2단계 결과가 없다면 1단계 조사 목록 확인
          const gData = getAcadData()[MultiState.activeYear]?.[item.grade];
          let semSubjs = (item.semester === 1 ? gData?.sem1Subjects : gData?.sem2Subjects) || [];
          if (!semSubjs || semSubjs.length === 0) {
            const semKey = (item.semester === 1 ? 'sem1' : 'sem2');
            const set = new Set();
            (gData?.students || []).forEach(st => {
              (st[semKey] || []).forEach(s => { if (s && s.trim()) set.add(s.trim()); });
            });
            semSubjs = Array.from(set);
          }
          if (semSubjs.length > 0) {
            const inSurvey = semSubjs.some(s => normalizeSubjectKey(s) === normSubj);
            const closedList = gData?.closedSubjects?.[item.semester] || [];
            const isClosed = closedList.some(s => normalizeSubjectKey(s) === normSubj);
            if (!inSurvey || isClosed) {
              item.status = '폐강';
              item.teacher = '폐강';
            }
          }
        }
      } else {
        // '지정'으로 바꾼 경우 필수 과목이므로 개설 복원
        item.status = '개설';
        if (item.teacher === '폐강') {
          item.teacher = item.originalTeacher || '';
        }
      }

      setAllGradesCurriculum(curriculum);
      renderAllGradesDashboard();
    };

    // 현재 수정 반영된 최신 기초데이터 엑셀 다운로드 (다른 기준 날짜 탭에 재업로드 완벽 호환 양식)
    window.exportCurrentCurriculumExcel = function() {
      const curriculum = getAllGradesCurriculum();
      const year = MultiState?.activeYear || '2027';

      if (!curriculum || curriculum.length === 0) {
        if (confirm('현재 등록된 기초데이터 과목이 없습니다.\n표준 빈 양식 엑셀을 다운로드하시겠습니까?')) {
          downloadCurriculumTemplate(true);
        }
        return;
      }

      const fontKo = '맑은 고딕';
      const borderThin = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };
      const borderHeader = {
        top: { style: 'medium', color: { rgb: '94A3B8' } },
        bottom: { style: 'medium', color: { rgb: '94A3B8' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      // 1. 헤더 및 데이터 행 구성 (기초데이터 엑셀 업로드와 100% 호환되는 표준 컬럼, 반 구분 포함)
      const rows = [
        ['학기', '학년', '구분', '반 구분', '과목명', '총 시수', '담당교사', '개설상태', '수정여부', '최초원래교사']
      ];

      curriculum.forEach(item => {
        rows.push([
          item.semester,
          item.grade,
          item.category || '선택',
          (item.division || (item.category === '선택' ? '선택' : '1반')).trim(),
          item.subject,
          item.hours || 0,
          item.teacher || '',
          item.status || '개설',
          item.isModified ? '수정됨' : '원본',
          item.originalTeacher || ''
        ]);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);

      // 열 너비 설정
      ws['!cols'] = [
        { wch: 8 },  // 학기
        { wch: 10 }, // 학년
        { wch: 10 }, // 구분
        { wch: 10 }, // 반 구분
        { wch: 24 }, // 과목명
        { wch: 10 }, // 총 시수
        { wch: 14 }, // 담당교사
        { wch: 10 }, // 개설상태
        { wch: 10 }, // 수정여부
        { wch: 14 }  // 최초원래교사
      ];

      // 행 높이 설정
      const rowHeights = [{ hpt: 26 }]; // Header
      for (let i = 0; i < curriculum.length; i++) {
        rowHeights.push({ hpt: 22 });
      }
      ws['!rows'] = rowHeights;

      // 헤더 파스텔 스타일 적용
      const headerColors = ['E0E7FF', 'E0E7FF', 'E0E7FF', 'DBEAFE', 'DBEAFE', 'D1FAE5', 'FEE2E2', 'F1F5F9', 'F1F5F9'];
      const headerTextColors = ['3730A3', '3730A3', '3730A3', '1E40AF', '1E40AF', '047857', '991B1B', '475569', '475569'];

      for (let c = 0; c < 9; c++) {
        const ref = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[ref]) {
          ws[ref].s = {
            fill: { fgColor: { rgb: headerColors[c] || 'E0E7FF' } },
            font: { name: fontKo, sz: 10.5, bold: true, color: { rgb: headerTextColors[c] || '1E40AF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderHeader
          };
        }
      }

      // 데이터 행 파스텔 스타일 적용
      curriculum.forEach((item, idx) => {
        const r = 1 + idx;
        const isEven = idx % 2 === 1;
        const bg = isEven ? 'F8FAFC' : 'FFFFFF';
        const isClosed = (item.status === '폐강' || item.teacher === '폐강');

        for (let c = 0; c < 9; c++) {
          const ref = XLSX.utils.encode_cell({ r, c });
          if (!ws[ref]) ws[ref] = { t: 's', v: '' };

          let cellBg = bg;
          let fontColor = '1E293B';
          let isBold = false;
          let align = 'center';

          if (c === 3) { // 과목명
            align = 'left';
            isBold = true;
            fontColor = isClosed ? '94A3B8' : '0F172A';
          } else if (c === 5) { // 담당교사
            if (item.teacher === '폐강') {
              cellBg = 'FEE2E2';
              fontColor = 'DC2626';
              isBold = true;
            } else if (item.isModified) {
              cellBg = 'EFF6FF';
              fontColor = '1D4ED8';
              isBold = true;
            }
          } else if (c === 6) { // 개설상태
            if (isClosed) {
              cellBg = 'FEE2E2';
              fontColor = 'DC2626';
              isBold = true;
            } else {
              cellBg = 'DCFCE7';
              fontColor = '16A34A';
              isBold = true;
            }
          }

          ws[ref].s = {
            fill: { fgColor: { rgb: cellBg } },
            font: { name: fontKo, sz: 10, bold: isBold, color: { rgb: fontColor } },
            alignment: { horizontal: align, vertical: 'center' },
            border: borderThin
          };
        }
      });

      XLSX.utils.book_append_sheet(wb, ws, '교육과정_기초데이터');

      const fileName = buildExportFileName("교육과정 기초데이터 최신본", "xlsx");
      window.saveExcelFile(wb, fileName);

      alert(`📥 [${year}] 최신 수정 기초데이터(${curriculum.length}개 과목)가 엑셀로 다운로드되었습니다!\n파일명: ${fileName}\n\n💡 다른 '기준 날짜' 탭을 만든 후, '전체 시수종합'에서 이 파일 그대로 [📂 기초데이터 엑셀 업로드]하시면 수정한 내용이 완벽하게 반영됩니다.`);
    };

    function downloadCurriculumTemplate(forceSample = false) {
      const curriculum = getAllGradesCurriculum();
      if (!forceSample && curriculum && curriculum.length > 0) {
        if (confirm(`💡 현재 수정된 최신 기초데이터(${curriculum.length}개 과목)가 등록되어 있습니다.\n\n- [확인]: 수정이 반영된 '최신 데이터' 다운로드 (다른 탭에 재업로드 가능)\n- [취소]: 초기 '표준 빈 양식' 다운로드`)) {
          window.exportCurrentCurriculumExcel();
          return;
        }
      }

      const sampleRows = sampleCurriculumData.map(item => ({
        '학기': item.semester,
        '학년': parseInt(item.grade) || item.grade,
        '구분': item.category,
        '반 구분': (item.division || (item.category === '선택' ? '선택' : '1반')).trim(),
        '과목명': item.subject,
        '총 시수': item.hours,
        '담당교사': item.teacher
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sampleRows);
      ws['!cols'] = [
        { wch: 8 },  // 학기
        { wch: 10 }, // 학년
        { wch: 12 }, // 구분
        { wch: 10 }, // 반 구분
        { wch: 22 }, // 과목명
        { wch: 10 }, // 총 시수
        { wch: 14 }  // 담당교사
      ];
      XLSX.utils.book_append_sheet(wb, ws, '교육과정_기초데이터_양식');
      const standardFileName = buildExportFileName("교육과정 기초데이터 표준양식", "xlsx");
      window.saveExcelFile(wb, standardFileName);
    }

    // 교사별 학기 수업 시수 및 담당 과목 요약표 엑셀 워크시트 생성 (깔끔한 파스텔 톤 서식, 1행에 과목 1개씩 전개)
    function createTeacherWorkloadSheet(curriculum, year) {
      const teacherMap = {};
      curriculum.forEach(item => {
        if (item.status === '폐강') return;
        const t = (item.teacher || '').trim();
        if (!t || t === '폐강') return;

        if (!teacherMap[t]) {
          teacherMap[t] = {
            sem1Courses: [],
            sem2Courses: [],
            sem1Hours: 0,
            sem2Hours: 0
          };
        }

        const divStr = (item.division && item.division !== '선택') ? ` ${item.division}` : '';
        const courseItem = {
          grade: item.grade,
          semester: item.semester,
          subject: item.subject,
          hours: item.hours || 0,
          category: item.category,
          division: item.division || '',
          tag: `[${item.grade}${divStr}] ${item.subject} (${item.hours || 0})`
        };

        if (item.semester === 1) {
          teacherMap[t].sem1Courses.push(courseItem);
          teacherMap[t].sem1Hours += (item.hours || 0);
        } else {
          teacherMap[t].sem2Courses.push(courseItem);
          teacherMap[t].sem2Hours += (item.hours || 0);
        }
      });

      const customOrder = getTeacherOrder();
      let teachersList = Object.keys(teacherMap);
      teachersList.sort((a, b) => {
        const idxA = customOrder.indexOf(a);
        const idxB = customOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b, 'ko');
      });

      const fontKo = '맑은 고딕';
      const borderThin = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };
      const borderTotal = {
        top: { style: 'thin', color: { rgb: '94A3B8' } },
        bottom: { style: 'double', color: { rgb: '334155' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      const aoa = [
        [`${year}학년도 교사별 학기 수업 시수 및 담당 과목 요약표`],
        [`출력일시: ${new Date().toLocaleDateString('ko-KR')} | 대상 교사: 총 ${teachersList.length}명 | 상지대관령고등학교`],
        [],
        ['순서', '교사명', '학기', '담당 과목 (학년 / 시수)', '1학기 시수', '2학기 시수', '연간 총시수', '학기당 평균시수']
      ];

      let sumSem1Hours = 0;
      let sumSem2Hours = 0;
      let totalCourseCount = 0;
      const dataRowsMeta = [];

      teachersList.forEach((tName, teacherIdx) => {
        const d = teacherMap[tName];
        const tot = d.sem1Hours + d.sem2Hours;
        const avg = parseFloat((tot / 2).toFixed(1));
        sumSem1Hours += d.sem1Hours;
        sumSem2Hours += d.sem2Hours;

        d.sem1Courses.sort((a, b) => (a.grade || '').localeCompare(b.grade || '', 'ko') || (a.subject || '').localeCompare(b.subject || '', 'ko'));
        d.sem2Courses.sort((a, b) => (a.grade || '').localeCompare(b.grade || '', 'ko') || (a.subject || '').localeCompare(b.subject || '', 'ko'));

        const allTeacherCourses = [
          ...d.sem1Courses.map(c => ({ semester: '1학기', semNum: 1, tag: c.tag, hours: c.hours })),
          ...d.sem2Courses.map(c => ({ semester: '2학기', semNum: 2, tag: c.tag, hours: c.hours }))
        ];

        if (allTeacherCourses.length === 0) {
          aoa.push([
            teacherIdx + 1,
            tName,
            '-',
            '(담당 과목 없음)',
            d.sem1Hours,
            d.sem2Hours,
            tot,
            avg
          ]);
          dataRowsMeta.push({
            teacherIdx,
            semNum: 0,
            hasCourse: false
          });
        } else {
          allTeacherCourses.forEach(c => {
            totalCourseCount++;
            aoa.push([
              teacherIdx + 1,
              tName,
              c.semester,
              c.tag,
              d.sem1Hours,
              d.sem2Hours,
              tot,
              avg
            ]);
            dataRowsMeta.push({
              teacherIdx,
              semNum: c.semNum,
              hasCourse: true
            });
          });
        }
      });

      aoa[1] = [`출력일시: ${new Date().toLocaleDateString('ko-KR')} | 대상 교사: 총 ${teachersList.length}명 (총 ${totalCourseCount}건 배정) | 상지대관령고등학교`];

      const grandTotal = sumSem1Hours + sumSem2Hours;
      const grandAvg = parseFloat((grandTotal / 2).toFixed(1));
      aoa.push([
        '합계',
        `교사 ${teachersList.length}명`,
        '-',
        `총 ${totalCourseCount}개 과목`,
        sumSem1Hours,
        sumSem2Hours,
        grandTotal,
        grandAvg
      ]);

      const ws = XLSX.utils.aoa_to_sheet(aoa);

      ws['!cols'] = [
        { wch: 7 },   // 순서
        { wch: 13 },  // 교사명
        { wch: 10 },  // 학기
        { wch: 38 },  // 담당 과목 (학년 / 시수)
        { wch: 13 },  // 1학기 시수
        { wch: 13 },  // 2학기 시수
        { wch: 14 },  // 연간 총시수
        { wch: 16 }   // 학기당 평균시수
      ];

      const rowsConfig = [
        { hpt: 30 }, // R0 Title
        { hpt: 18 }, // R1 Subtitle
        { hpt: 8 },  // R2 Gap
        { hpt: 26 }, // R3 Header
      ];
      for (let i = 0; i < dataRowsMeta.length; i++) {
        rowsConfig.push({ hpt: 22 });
      }
      rowsConfig.push({ hpt: 26 }); // Total Row
      ws['!rows'] = rowsConfig;

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
      ];

      // R0 Title
      const cellTitle = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (ws[cellTitle]) {
        ws[cellTitle].s = {
          font: { name: fontKo, sz: 15, bold: true, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
      // R1 Subtitle
      const cellSub = XLSX.utils.encode_cell({ r: 1, c: 0 });
      if (ws[cellSub]) {
        ws[cellSub].s = {
          font: { name: fontKo, sz: 9.5, italic: true, color: { rgb: '64748B' } },
          alignment: { horizontal: 'right', vertical: 'center' }
        };
      }

      // R3 Header (항목은 조금 진한 톤)
      const headerStyles = [
        { fill: { fgColor: { rgb: '475569' } }, font: { name: fontKo, sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin },
        { fill: { fgColor: { rgb: '334155' } }, font: { name: fontKo, sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin },
        { fill: { fgColor: { rgb: '0284C7' } }, font: { name: fontKo, sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin },
        { fill: { fgColor: { rgb: '2563EB' } }, font: { name: fontKo, sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin },
        { fill: { fgColor: { rgb: '1D4ED8' } }, font: { name: fontKo, sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin },
        { fill: { fgColor: { rgb: '047857' } }, font: { name: fontKo, sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin },
        { fill: { fgColor: { rgb: '4F46E5' } }, font: { name: fontKo, sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin },
        { fill: { fgColor: { rgb: '4338CA' } }, font: { name: fontKo, sz: 10, bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: borderThin }
      ];
      for (let c = 0; c < 8; c++) {
        const ref = XLSX.utils.encode_cell({ r: 3, c });
        if (ws[ref]) ws[ref].s = headerStyles[c];
      }

      // R4 ~ Data Rows (연한 파스텔 톤)
      const dataStartR = 4;
      for (let i = 0; i < dataRowsMeta.length; i++) {
        const r = dataStartR + i;
        const meta = dataRowsMeta[i];
        const isEven = (meta.teacherIdx % 2 === 0);

        // 연번
        const ref0 = XLSX.utils.encode_cell({ r, c: 0 });
        if (ws[ref0]) {
          ws[ref0].s = {
            fill: { fgColor: { rgb: isEven ? 'FFFFFF' : 'F8FAFC' } },
            font: { name: fontKo, sz: 9.5, color: { rgb: '64748B' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin
          };
        }

        // 교사명
        const ref1 = XLSX.utils.encode_cell({ r, c: 1 });
        if (ws[ref1]) {
          ws[ref1].s = {
            fill: { fgColor: { rgb: isEven ? 'FFFFFF' : 'F8FAFC' } },
            font: { name: fontKo, sz: 10.5, bold: true, color: { rgb: '0F172A' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin
          };
        }

        // 학기
        const ref2 = XLSX.utils.encode_cell({ r, c: 2 });
        if (ws[ref2]) {
          let semBg = isEven ? 'FFFFFF' : 'F8FAFC';
          let semColor = '64748B';
          if (meta.semNum === 1) {
            semBg = isEven ? 'F0F7FF' : 'EBF5FF';
            semColor = '1D4ED8';
          } else if (meta.semNum === 2) {
            semBg = isEven ? 'F0FDF4' : 'ECFDF5';
            semColor = '047857';
          }
          ws[ref2].s = {
            fill: { fgColor: { rgb: semBg } },
            font: { name: fontKo, sz: 10, bold: true, color: { rgb: semColor } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin
          };
        }

        // 담당 과목
        const ref3 = XLSX.utils.encode_cell({ r, c: 3 });
        if (ws[ref3]) {
          let subjBg = isEven ? 'FFFFFF' : 'F8FAFC';
          let subjColor = '1E3A8A';
          if (meta.semNum === 1) {
            subjBg = isEven ? 'F0F7FF' : 'EBF5FF';
            subjColor = '1E3A8A';
          } else if (meta.semNum === 2) {
            subjBg = isEven ? 'F0FDF4' : 'ECFDF5';
            subjColor = '064E3B';
          } else {
            subjColor = '94A3B8';
          }
          ws[ref3].s = {
            fill: { fgColor: { rgb: subjBg } },
            font: { name: fontKo, sz: 10, bold: meta.hasCourse, italic: !meta.hasCourse, color: { rgb: subjColor } },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: borderThin
          };
        }

        // 1학기 시수 (파스텔 블루)
        const ref4 = XLSX.utils.encode_cell({ r, c: 4 });
        if (ws[ref4]) {
          ws[ref4].s = {
            fill: { fgColor: { rgb: 'DBEAFE' } },
            font: { name: fontKo, sz: 10, bold: true, color: { rgb: '1D4ED8' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin
          };
        }

        // 2학기 시수 (파스텔 에메랄드)
        const ref5 = XLSX.utils.encode_cell({ r, c: 5 });
        if (ws[ref5]) {
          ws[ref5].s = {
            fill: { fgColor: { rgb: 'D1FAE5' } },
            font: { name: fontKo, sz: 10, bold: true, color: { rgb: '047857' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin
          };
        }

        // 연간 총시수 (소프트 슬레이트)
        const ref6 = XLSX.utils.encode_cell({ r, c: 6 });
        if (ws[ref6]) {
          ws[ref6].s = {
            fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'F1F5F9' } },
            font: { name: fontKo, sz: 10.5, bold: true, color: { rgb: '0F172A' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin
          };
        }

        // 학기당 평균시수 (연한 파스텔 라벤더)
        const ref7 = XLSX.utils.encode_cell({ r, c: 7 });
        if (ws[ref7]) {
          ws[ref7].s = {
            fill: { fgColor: { rgb: 'EEF2FF' } },
            font: { name: fontKo, sz: 10.5, bold: true, color: { rgb: '4338CA' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin
          };
        }
      }

      // 합계 행 (연한 파스텔 크림/앰버)
      const totalRowIdx = dataStartR + dataRowsMeta.length;
      for (let c = 0; c < 8; c++) {
        const ref = XLSX.utils.encode_cell({ r: totalRowIdx, c });
        if (ws[ref]) {
          ws[ref].s = {
            fill: { fgColor: { rgb: 'FEF3C7' } },
            font: { 
              name: fontKo, 
              sz: 10.5, 
              bold: true, 
              color: { rgb: (c === 4 ? '1D4ED8' : (c === 5 ? '047857' : (c >= 6 ? '4338CA' : '78350F'))) } 
            },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderTotal
          };
        }
      }

      return { ws, count: teachersList.length };
    }

    // 교사별 학기 수업 시수 및 담당 과목 요약 전용 엑셀 다운로드
    window.exportTeacherWorkloadExcel = function() {
      const curriculum = getAllGradesCurriculum();
      if (!curriculum || curriculum.length === 0) {
        alert('내보낼 기초데이터 과목이 없습니다.');
        return;
      }
      const year = MultiState?.activeYear || '2027';
      const { ws, count } = createTeacherWorkloadSheet(curriculum, year);
      if (!ws || count === 0) {
        alert('배정된 담당 교사 데이터가 없습니다.');
        return;
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '교사별_수업시수_요약');

      const fileName = buildExportFileName("교사별 학기수업시수 및 담당과목 요약", "xlsx");
      window.saveExcelFile(wb, fileName);
      console.log(`✅ [${fileName}] 파스텔톤 서식 엑셀 다운로드 완료`);
    };

    // ==========================================
    // 출판사 매칭 및 과목 정규화 유틸리티
    // ==========================================
    function normalizeSubjectForPublisher(subj) {
      if (!subj) return '';
      let s = String(subj);
      s = s.replace(/\[[^\]]*\]/g, ' ');
      s = getBaseSubjectName(s);
      s = s.replace(/Ⅰ/g, '1')
           .replace(/Ⅱ/g, '2')
           .replace(/Ⅲ/g, '3')
           .replace(/Ⅳ/g, '4')
           .replace(/Ⅴ/g, '5')
           .replace(/Ⅵ/g, '6')
           .replace(/１/g, '1')
           .replace(/２/g, '2')
           .replace(/３/g, '3')
           .replace(/４/g, '4');
      s = s.replace(/[\s\u3000\-_/.,·~*※†‡★☆▲■●#^()\[\]{}'"]/g, '');
      return s.toLowerCase();
    }

    function getPublisherForSubject(subjName) {
      if (!subjName) return '';
      const curAY = MultiState.activeAcademicYear || '2027학년도';
      const map = MultiState.publishersByAcademicYear?.[curAY] || {};
      const norm = normalizeSubjectForPublisher(subjName);
      if (map[norm]) return map[norm];
      
      const baseNorm = normalizeSubjectKey(subjName);
      for (const k in map) {
        if (k === norm || k === baseNorm) return map[k];
      }
      return '';
    }

    // 과목 기준 데이터 정리에 사용되는 공통 과목 목록 산출 헬퍼
    function getConsolidatedSubjectList() {
      const curriculum = getAllGradesCurriculum();
      const curDate = MultiState?.activeYear || '2027.10.11.';
      const acadData = getAcadData();
      const yData = acadData[curDate] || {};

      let subjectList = [];

      if (curriculum && curriculum.length > 0) {
        subjectList = curriculum.map(c => ({
          semester: c.semester,
          grade: c.grade,
          subject: c.subject,
          division: c.division || '',
          teacher: c.teacher || '-',
          status: c.status || '개설',
          category: c.category || ''
        }));
      } else {
        ['2학년', '3학년'].forEach(gradeStr => {
          const gData = yData[gradeStr];
          if (!gData) return;
          [1, 2].forEach(sem => {
            const rawSubjs = (sem === 1 ? gData.sem1Subjects : gData.sem2Subjects) || [];
            const closedList = gData.closedSubjects?.[sem] || [];
            rawSubjs.forEach(s => {
              subjectList.push({
                semester: sem,
                grade: gradeStr,
                subject: s,
                division: '',
                teacher: '-',
                status: closedList.includes(s) ? '폐강' : '개설',
                category: '선택'
              });
            });
          });
        });
      }

      ['2학년', '3학년'].forEach(gradeStr => {
        const gData = yData[gradeStr];
        if (!gData) return;
        [1, 2].forEach(sem => {
          const rawSubjs = (sem === 1 ? gData.sem1Subjects : gData.sem2Subjects) || [];
          const closedList = gData.closedSubjects?.[sem] || [];
          rawSubjs.forEach(s => {
            const norm = normalizeSubjectKey(s);
            const exists = subjectList.some(item => 
              item.semester === sem && 
              item.grade === gradeStr && 
              normalizeSubjectKey(item.subject) === norm
            );
            if (!exists) {
              subjectList.push({
                semester: sem,
                grade: gradeStr,
                subject: s,
                division: '',
                teacher: '-',
                status: closedList.includes(s) ? '폐강' : '개설',
                category: '선택'
              });
            }
          });
        });
      });

      // 정렬: 학기(1->2) -> 학년(1->2->3) -> 과목명(가나다)
      subjectList.sort((a, b) => {
        if (a.semester !== b.semester) return a.semester - b.semester;
        const gOrder = { '1학년': 1, '2학년': 2, '3학년': 3 };
        const gDiff = (gOrder[a.grade] || 9) - (gOrder[b.grade] || 9);
        if (gDiff !== 0) return gDiff;
        return String(a.subject).localeCompare(String(b.subject), 'ko');
      });

      return subjectList;
    }
    window.getConsolidatedSubjectList = getConsolidatedSubjectList;

    let currentPublisherFilter = 'all';

    function openPublisherManagerModal() {
      const modal = document.getElementById('publisherManagerModal');
      if (!modal) return;
      const yearBadge = document.getElementById('publisherManagerYearBadge');
      if (yearBadge) {
        yearBadge.textContent = MultiState?.activeAcademicYear || '2027학년도';
      }
      currentPublisherFilter = 'all';
      updatePublisherFilterButtonsUI();
      renderPublisherManagerTable();
      modal.classList.remove('hidden');
    }
    window.openPublisherManagerModal = openPublisherManagerModal;

    function closePublisherManagerModal() {
      document.getElementById('publisherManagerModal')?.classList.add('hidden');
    }
    window.closePublisherManagerModal = closePublisherManagerModal;

    function filterPublisherTable(filterType) {
      currentPublisherFilter = filterType;
      updatePublisherFilterButtonsUI();
      renderPublisherManagerTable();
    }
    window.filterPublisherTable = filterPublisherTable;

    function updatePublisherFilterButtonsUI() {
      document.querySelectorAll('.pub-filter-btn').forEach(btn => {
        if (btn.getAttribute('data-filter') === currentPublisherFilter) {
          btn.className = 'pub-filter-btn px-2.5 py-1 rounded-lg text-purple-700 bg-purple-100 font-bold transition';
        } else {
          btn.className = 'pub-filter-btn px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition';
        }
      });
    }

    function renderPublisherManagerTable() {
      const tbody = document.getElementById('publisherTableBody');
      if (!tbody) return;

      const subjectList = getConsolidatedSubjectList();
      const searchVal = (document.getElementById('publisherSearchInput')?.value || '').trim().toLowerCase();

      let filledCount = 0;
      let totalCount = subjectList.length;

      // Group or map unique subjects
      const renderedRows = [];

      subjectList.forEach((item, idx) => {
        const currentPub = getPublisherForSubject(item.subject);
        if (currentPub) filledCount++;

        // Filter by grade / missing
        if (currentPublisherFilter === '1학년' && item.grade !== '1학년') return;
        if (currentPublisherFilter === '2학년' && item.grade !== '2학년') return;
        if (currentPublisherFilter === '3학년' && item.grade !== '3학년') return;
        if (currentPublisherFilter === 'missing' && currentPub) return;

        // Search query
        if (searchVal) {
          const matchSubj = item.subject.toLowerCase().includes(searchVal);
          const matchPub = currentPub.toLowerCase().includes(searchVal);
          const matchGrade = item.grade.toLowerCase().includes(searchVal);
          if (!matchSubj && !matchPub && !matchGrade) return;
        }

        const isEven = (renderedRows.length % 2 === 1);
        const rowBg = isEven ? 'bg-slate-50/60' : 'bg-white';
        const isClosed = (item.status === '폐강');

        const catBadge = isClosed 
          ? '<span class="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">폐강</span>'
          : (item.category === '지정' || item.category === '학교지정' 
            ? '<span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">지정</span>' 
            : '<span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">선택</span>');

        renderedRows.push(`
          <tr class="${rowBg} hover:bg-purple-50/40 transition">
            <td class="py-2 px-3 text-center font-bold text-slate-600">${item.semester}학기</td>
            <td class="py-2 px-3 text-center font-bold text-slate-800">${item.grade}</td>
            <td class="py-2 px-3 text-center">${catBadge}</td>
            <td class="py-2 px-3 font-bold ${isClosed ? 'text-rose-700 line-through' : 'text-slate-900'}">
              ${item.subject}
              ${item.teacher && item.teacher !== '-' ? `<span class="text-[10px] text-slate-400 font-normal ml-1">(${item.teacher})</span>` : ''}
            </td>
            <td class="py-2 px-3">
              <input type="text" 
                     class="pub-edit-input w-full px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-purple-400 outline-none shadow-2xs transition" 
                     data-subject="${item.subject}" 
                     value="${currentPub}" 
                     placeholder="출판사명 입력" />
            </td>
            <td class="py-2 px-3 text-center">
              ${currentPub 
                ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">등록됨</span>'
                : '<span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">미등록</span>'
              }
            </td>
          </tr>
        `);
      });

      tbody.innerHTML = renderedRows.length > 0 
        ? renderedRows.join('')
        : '<tr><td colspan="6" class="py-8 text-center text-slate-400 font-medium">검색 조건에 일치하는 과목이 없습니다.</td></tr>';

      const statsSpan = document.getElementById('publisherStatsSummary');
      if (statsSpan) {
        const pct = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;
        statsSpan.textContent = `총 ${totalCount}개 과목 중 ${filledCount}개 등록 (${pct}%)`;
      }
    }
    window.renderPublisherManagerTable = renderPublisherManagerTable;

    function savePublisherManagerModal() {
      const inputs = document.querySelectorAll('.pub-edit-input');
      const curAY = MultiState.activeAcademicYear || '2027학년도';
      if (!MultiState.publishersByAcademicYear) MultiState.publishersByAcademicYear = {};
      if (!MultiState.publishersByAcademicYear[curAY]) MultiState.publishersByAcademicYear[curAY] = {};

      let savedCount = 0;
      if (!MultiState.publisherSubjectNamesByAcademicYear) MultiState.publisherSubjectNamesByAcademicYear = {};
      if (!MultiState.publisherSubjectNamesByAcademicYear[curAY]) MultiState.publisherSubjectNamesByAcademicYear[curAY] = {};

      inputs.forEach(inp => {
        const subj = inp.getAttribute('data-subject');
        const pubVal = inp.value.trim();
        const normKey = normalizeSubjectForPublisher(subj);
        if (normKey) {
          if (pubVal) {
            MultiState.publishersByAcademicYear[curAY][normKey] = pubVal;
            MultiState.publisherSubjectNamesByAcademicYear[curAY][normKey] = subj;
            savedCount++;
          } else {
            delete MultiState.publishersByAcademicYear[curAY][normKey];
            delete MultiState.publisherSubjectNamesByAcademicYear[curAY][normKey];
          }
        }
      });

      saveAllState();
      updatePublisherButtonUI();
      renderPublisherManagerTable();

      // JSON 파일 자동 동기화 저장
      if (typeof window.handleMainSaveButtonClick === 'function') {
        window.handleMainSaveButtonClick();
      }

      alert('💾 출판사 정보가 성공적으로 저장되었습니다!\n' + `현재 ${Object.keys(MultiState.publishersByAcademicYear[curAY] || {}).length}개 과목 출판사가 등록되어 있으며 JSON 파일에도 안전하게 저장되었습니다.`);
    }
    window.savePublisherManagerModal = savePublisherManagerModal;

    function updatePublisherButtonUI() {
      const curAY = MultiState.activeAcademicYear || '2027학년도';
      const map = MultiState.publishersByAcademicYear?.[curAY] || {};
      const count = Object.keys(map).length;
      const statusSpan = document.getElementById('txtPublisherUploadStatus');
      const groupDiv = document.getElementById('publisherButtonGroup');
      if (statusSpan) {
        if (count > 0) {
          statusSpan.textContent = `출판사 등록됨 (${count}개)`;
          if (groupDiv) {
            groupDiv.classList.remove('border-purple-400', 'bg-purple-50', 'text-purple-900');
            groupDiv.classList.add('border-indigo-400', 'bg-indigo-50', 'text-indigo-900');
          }
        } else {
          statusSpan.textContent = '출판사 엑셀 등록';
          if (groupDiv) {
            groupDiv.classList.remove('border-indigo-400', 'bg-indigo-50', 'text-indigo-900');
            groupDiv.classList.add('border-purple-400', 'bg-purple-50', 'text-purple-900');
          }
        }
      }
    }

    // ==========================================
    // PUBLISHER EXCEL IMPORT & CONFLICT RESOLUTION
    // ==========================================
    let publisherConflictQueue = [];
    let publisherConflictIndex = 0;
    let publisherConflictStats = { kept: 0, overwritten: 0, newAdded: 0, unchanged: 0 };
    let publisherConflictTargetAY = '2027학년도';
    let publisherPendingNewItems = [];

    function parsePublisherExcel(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) {
            alert('⚠️ 엑셀 시트를 읽을 수 없습니다.');
            return;
          }
          const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          if (!rawRows || rawRows.length === 0) {
            alert('⚠️ 엑셀 파일에 데이터가 없습니다.');
            return;
          }

          let subjColIdx = -1;
          let pubColIdx = -1;
          let startRowIdx = 0;

          for (let r = 0; r < Math.min(6, rawRows.length); r++) {
            const row = rawRows[r];
            if (!Array.isArray(row)) continue;
            for (let c = 0; c < row.length; c++) {
              const val = String(row[c] || '').trim();
              if (subjColIdx === -1 && /^(과목|과목명|교과목|교과목명|과목 명|교과)$/i.test(val)) {
                subjColIdx = c;
              } else if (subjColIdx === -1 && /과목|교과/i.test(val) && !/출판|발행|교사|선생|비고/i.test(val)) {
                subjColIdx = c;
              }
              if (pubColIdx === -1 && /^(출판사|출판사명|출판|출판 사|발행사|발행처)$/i.test(val)) {
                pubColIdx = c;
              } else if (pubColIdx === -1 && /출판|발행/i.test(val)) {
                pubColIdx = c;
              }
            }
            if (subjColIdx !== -1 && pubColIdx !== -1) {
              startRowIdx = r + 1;
              break;
            }
          }

          if (subjColIdx === -1 || pubColIdx === -1) {
            startRowIdx = 0;
            if (rawRows.length > 1 && String(rawRows[0][0] || '').includes('출판')) {
              startRowIdx = 1;
            }
            subjColIdx = 0;
            pubColIdx = 1;
          }

          const curAY = MultiState.activeAcademicYear || '2027학년도';
          if (!MultiState.publishersByAcademicYear) MultiState.publishersByAcademicYear = {};
          if (!MultiState.publishersByAcademicYear[curAY]) MultiState.publishersByAcademicYear[curAY] = {};
          if (!MultiState.publisherSubjectNamesByAcademicYear) MultiState.publisherSubjectNamesByAcademicYear = {};
          if (!MultiState.publisherSubjectNamesByAcademicYear[curAY]) MultiState.publisherSubjectNamesByAcademicYear[curAY] = {};

          const existingPubMap = MultiState.publishersByAcademicYear[curAY];
          const existingNameMap = MultiState.publisherSubjectNamesByAcademicYear[curAY];

          const newItems = [];
          const conflicts = [];
          const stats = { kept: 0, overwritten: 0, newAdded: 0, unchanged: 0 };

          for (let r = startRowIdx; r < rawRows.length; r++) {
            const row = rawRows[r];
            if (!row || !Array.isArray(row)) continue;
            const rawSubj = String(row[subjColIdx] || '').trim();
            const rawPub = String(row[pubColIdx] || '').trim();
            if (!rawSubj || !rawPub) continue;
            if (/^(과목|과목명|교과|순번|연번)$/i.test(rawSubj)) continue;

            const normKey = normalizeSubjectForPublisher(rawSubj);
            if (!normKey) continue;

            const existingPub = existingPubMap[normKey];

            if (!existingPub) {
              // 1. 신규 과목 (기존에 등록되어 있지 않음) -> 자동 추가
              newItems.push({ normKey, subjectName: rawSubj, publisher: rawPub });
              stats.newAdded++;
            } else if (existingPub.trim().toLowerCase() === rawPub.trim().toLowerCase()) {
              // 2. 동일한 데이터 -> 그대로 유지
              stats.unchanged++;
            } else {
              // 3. 기존 데이터와 상이 -> 사용자에게 하나씩 물어보고 선택
              conflicts.push({
                normKey,
                subjectName: rawSubj || existingNameMap[normKey] || normKey,
                existingPub: existingPub.trim(),
                newPub: rawPub.trim()
              });
            }
          }

          if (conflicts.length === 0) {
            // 충돌이 없는 경우: 신규 데이터 즉시 반영 후 JSON 저장
            newItems.forEach(item => {
              existingPubMap[item.normKey] = item.publisher;
              existingNameMap[item.normKey] = item.subjectName;
            });

            saveAllState();
            updatePublisherButtonUI();
            renderPublisherManagerTable();

            // JSON 파일에도 자동 동기화 저장
            if (typeof window.handleMainSaveButtonClick === 'function') {
              window.handleMainSaveButtonClick();
            }

            alert(`🎉 출판사 데이터가 성공적으로 등록되었습니다!\n\n- 신규 등록: ${stats.newAdded}개 과목\n- 기존 동일 유지: ${stats.unchanged}개 과목\n- JSON 파일에도 안전하게 자동 저장되었습니다.`);
          } else {
            // 충돌이 발생한 경우: 모달을 열고 1개씩 대조 질문 진행
            publisherConflictQueue = conflicts;
            publisherConflictIndex = 0;
            publisherPendingNewItems = newItems;
            publisherConflictStats = stats;
            publisherConflictTargetAY = curAY;

            window.renderPublisherConflictStep();
          }
        } catch (err) {
          console.error('Error parsing publisher excel:', err);
          alert('❌ 출판사 엑셀 파일을 읽는 도중 오류가 발생했습니다: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    window.parsePublisherExcel = parsePublisherExcel;

    window.renderPublisherConflictStep = function() {
      const modal = document.getElementById('publisherConflictModal');
      if (!modal) return;

      if (publisherConflictIndex >= publisherConflictQueue.length) {
        // 모든 충돌 항목 처리 완료 -> 최종 커밋 및 JSON 저장
        const ay = publisherConflictTargetAY;
        const existingPubMap = MultiState.publishersByAcademicYear[ay];
        const existingNameMap = MultiState.publisherSubjectNamesByAcademicYear[ay];

        publisherPendingNewItems.forEach(item => {
          existingPubMap[item.normKey] = item.publisher;
          existingNameMap[item.normKey] = item.subjectName;
        });

        modal.classList.add('hidden');
        saveAllState();
        updatePublisherButtonUI();
        renderPublisherManagerTable();

        // JSON 파일 동기화 저장
        if (typeof window.handleMainSaveButtonClick === 'function') {
          window.handleMainSaveButtonClick();
        }

        const s = publisherConflictStats;
        alert(`🎉 출판사 등록 및 변경 선택이 완료되었습니다!\n\n- 기존 출판사 유지: ${s.kept}개\n- 새 출판사로 변경: ${s.overwritten}개\n- 신규 과목 등록: ${s.newAdded}개\n- 기존 동일 유지: ${s.unchanged}개\n\n💾 JSON 파일에도 안전하게 저장되었습니다.`);
        return;
      }

      // 현재 대조 항목 표시
      const item = publisherConflictQueue[publisherConflictIndex];
      const progressBadge = document.getElementById('publisherConflictProgressBadge');
      const subjEl = document.getElementById('publisherConflictSubjectName');
      const existEl = document.getElementById('publisherConflictExistingPub');
      const newEl = document.getElementById('publisherConflictNewPub');

      if (progressBadge) progressBadge.textContent = `${publisherConflictIndex + 1} / ${publisherConflictQueue.length}`;
      if (subjEl) subjEl.textContent = item.subjectName;
      if (existEl) existEl.textContent = item.existingPub;
      if (newEl) newEl.textContent = item.newPub;

      modal.classList.remove('hidden');
    };

    window.resolveCurrentPublisherConflict = function(decision) {
      const ay = publisherConflictTargetAY;
      const existingPubMap = MultiState.publishersByAcademicYear[ay];
      const existingNameMap = MultiState.publisherSubjectNamesByAcademicYear[ay];
      const item = publisherConflictQueue[publisherConflictIndex];

      if (decision === 'keep') {
        // 기존 유지
        publisherConflictStats.kept++;
        publisherConflictIndex++;
        window.renderPublisherConflictStep();
      } else if (decision === 'overwrite') {
        // 새 데이터 적용
        existingPubMap[item.normKey] = item.newPub;
        existingNameMap[item.normKey] = item.subjectName;
        publisherConflictStats.overwritten++;
        publisherConflictIndex++;
        window.renderPublisherConflictStep();
      } else if (decision === 'keep_all') {
        // 남은 모든 충돌 기존 유지
        const remaining = publisherConflictQueue.length - publisherConflictIndex;
        publisherConflictStats.kept += remaining;
        publisherConflictIndex = publisherConflictQueue.length;
        window.renderPublisherConflictStep();
      } else if (decision === 'overwrite_all') {
        // 남은 모든 충돌 새 데이터 적용
        while (publisherConflictIndex < publisherConflictQueue.length) {
          const cur = publisherConflictQueue[publisherConflictIndex];
          existingPubMap[cur.normKey] = cur.newPub;
          existingNameMap[cur.normKey] = cur.subjectName;
          publisherConflictStats.overwritten++;
          publisherConflictIndex++;
        }
        window.renderPublisherConflictStep();
      }
    };

    window.cancelPublisherConflictResolution = function() {
      if (confirm('출판사 엑셀 등록을 취소하시겠습니까?\n(선택하지 않은 변경 사항은 반영되지 않고 기존 데이터가 보존됩니다)')) {
        const modal = document.getElementById('publisherConflictModal');
        if (modal) modal.classList.add('hidden');
      }
    };

    // ==========================================
    // 과목 기준 데이터 정리 워크시트 생성 (공통 헬퍼)
    // ==========================================
    function createSubjectBasedWorksheet() {
      const acadYearStr = MultiState?.activeAcademicYear || '2027학년도';
      const curDate = MultiState?.activeYear || '2027.10.11.';
      const acadData = getAcadData();
      const yData = acadData[curDate] || {};

      // 과목 데이터 준비
      const rawSubjectList = getConsolidatedSubjectList();
      if (rawSubjectList.length === 0) {
        return { ws: null, count: 0 };
      }

      // 학생 데이터 수집
      const studentsByGrade = {
        '2학년': yData['2학년']?.students || [],
        '3학년': yData['3학년']?.students || [],
        '1학년': yData['1학년']?.students || []
      };

      const classCounts = getGradeClassCounts();

      // 동일 과목 묶음 산출 (학기, 학년, 정규화 과목명 기준 그룹핑)
      const groupedCourseMap = new Map();
      rawSubjectList.forEach(item => {
        const normKey = `${item.semester}_${item.grade}_${normalizeSubjectKey(item.subject)}`;
        if (!groupedCourseMap.has(normKey)) {
          groupedCourseMap.set(normKey, []);
        }
        groupedCourseMap.get(normKey).push(item);
      });

      // 정렬: 학기(1->2) -> 학년(1->2->3) -> 과목명(가나다)
      const sortedGroupKeys = Array.from(groupedCourseMap.keys()).sort((kA, kB) => {
        const itemA = groupedCourseMap.get(kA)[0];
        const itemB = groupedCourseMap.get(kB)[0];
        if (itemA.semester !== itemB.semester) return itemA.semester - itemB.semester;
        const gOrder = { '1학년': 1, '2학년': 2, '3학년': 3 };
        const gDiff = (gOrder[itemA.grade] || 9) - (gOrder[itemB.grade] || 9);
        if (gDiff !== 0) return gDiff;
        return String(itemA.subject).localeCompare(String(itemB.subject), 'ko');
      });

      // 8개 열 구조: 학기, 학년, 과목명(총원), 반, 수강인원, 수강자 명단, 출판사, 담당 교사
      const rows = [];
      rows.push([`${acadYearStr} 과목 기준 데이터 정리 현황 (반별 행 분리 및 셀 병합)`]);
      rows.push([`기준 날짜: ${curDate} | 출력일시: ${new Date().toLocaleString()} | 서식: 과목명(총원) 및 학급별 명렬 분리`]);
      rows.push([]);
      rows.push(['학기', '학년', '과목명(총원)', '반', '수강인원', '수강자 명단', '출판사', '담당 교사']);

      const rowHeights = [
        { hpt: 32 },
        { hpt: 20 },
        { hpt: 8 },
        { hpt: 26 }
      ];

      const wsMerges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }
      ];

      const courseMergeRanges = [];
      const rowStyleInfo = [];

      let courseCounter = 0;

      sortedGroupKeys.forEach(groupKey => {
        const items = groupedCourseMap.get(groupKey);
        const representative = items[0];
        const sem = representative.semester;
        const gradeStr = representative.grade;
        const subjName = representative.subject;
        const normSubj = normalizeSubjectKey(subjName);
        const baseSubj = getBaseSubjectName(subjName);
        const publisher = getPublisherForSubject(subjName);
        const students = studentsByGrade[gradeStr] || [];

        const isClosed = items.every(it => it.status === '폐강');
        const courseStartRow = rows.length;
        const currentTeachers = [];
        const isEven = (courseCounter % 2 === 0);
        courseCounter++;

        const maxClassesForGrade = parseInt(classCounts[gradeStr] || 2, 10);
        const isBoonban = items.some(it => (it.division || '').includes('분반')) || 
                          (items.length > maxClassesForGrade && items.some(it => it.category === '지정' || it.category === '학교지정'));

        if (isClosed) {
          // 폐강 과목: 1개 행으로 표기
          rows.push([
            `${sem}학기`,
            gradeStr,
            `${subjName} (0명)`,
            '폐강',
            '0명',
            '폐강 확정',
            publisher,
            representative.teacher || '-'
          ]);
          currentTeachers.push(representative.teacher || '-');
          rowHeights.push({ hpt: 24 });
          rowStyleInfo.push({ isClosed: true, isEven });
        } else if (isBoonban) {
          // 분반 과목 (수강인원은 미기입, 총원만 과목명(총원)에서 확인)
          let totalCount = 0;
          if (students.length > 0) {
            if (representative.category === '지정' || representative.category === '학교지정' || gradeStr === '1학년') {
              totalCount = students.length;
            } else {
              const enrolled = students.filter(st => {
                const choices = (sem === 1 ? st.sem1 : st.sem2) || [];
                return choices.some(ch => ch && (ch === subjName || ch === baseSubj || normalizeSubjectKey(ch) === normSubj));
              });
              totalCount = enrolled.length;
            }
          }
          if (totalCount === 0) {
            totalCount = (gradeStr === '1학년' ? 44 : (gradeStr === '2학년' ? 44 : 19));
          }

          items.forEach((it, itIdx) => {
            let divText = (it.division || '').trim();
            if (!divText || divText === '선택' || divText === '분반') {
              divText = `분반${itIdx + 1}`;
            }

            rows.push([
              `${sem}학기`,
              gradeStr,
              `${subjName} (${totalCount}명)`,
              divText,
              '', // 수강자 인원 미기입
              '', // 수강자 명단 미기입
              publisher,
              it.teacher || '-'
            ]);
            currentTeachers.push(it.teacher || '-');
            rowHeights.push({ hpt: 24 });
            rowStyleInfo.push({ isClosed: false, isEven });
          });
        } else if (gradeStr === '1학년') {
          // 1학년 (신입생 전원 수강): 사전데이터 우선 적용 및 학급 수 기준 행 분리
          const priorG1 = yData['1학년']?.priorData?.students;
          const g1Students = (priorG1 && priorG1.length > 0) ? priorG1 : students;
          const totalGrade1Students = g1Students.length || 44;
          const class1 = g1Students.filter(st => String(st.classNum).replace(/[^0-9]/g, '') === '1');
          const class2 = g1Students.filter(st => String(st.classNum).replace(/[^0-9]/g, '') === '2');
          const half1 = class1.length > 0 ? class1.length : Math.floor(totalGrade1Students / 2);
          const half2 = class2.length > 0 ? class2.length : (totalGrade1Students - half1);
          const l1 = class1.map(st => `${st.studentNum ? st.studentNum + '번 ' : ''}${st.name || '학생'}`.trim());
          const l2 = class2.map(st => `${st.studentNum ? st.studentNum + '번 ' : ''}${st.name || '학생'}`.trim());
          l1.sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));
          l2.sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));

          const teacher1 = items[0]?.teacher || '-';
          const teacher2 = items[1]?.teacher || items[0]?.teacher || '-';
          const r1Roster = l1.length > 0 ? l1.join(', ') : `전원 배정 (1반 ${half1}명)`;
          const r2Roster = l2.length > 0 ? l2.join(', ') : `전원 배정 (2반 ${half2}명)`;

          rows.push([
            `${sem}학기`,
            gradeStr,
            `${subjName} (${totalGrade1Students}명)`,
            '1반',
            `${half1}명`,
            r1Roster,
            publisher,
            teacher1
          ]);
          currentTeachers.push(teacher1);
          rowHeights.push({ hpt: Math.max(24, Math.min(90, 20 + Math.ceil(r1Roster.length / 50) * 13)) });
          rowStyleInfo.push({ isClosed: false, isEven });

          rows.push([
            `${sem}학기`,
            gradeStr,
            `${subjName} (${totalGrade1Students}명)`,
            '2반',
            `${half2}명`,
            r2Roster,
            publisher,
            teacher2
          ]);
          currentTeachers.push(teacher2);
          rowHeights.push({ hpt: Math.max(24, Math.min(90, 20 + Math.ceil(r2Roster.length / 50) * 13)) });
          rowStyleInfo.push({ isClosed: false, isEven });
        } else if (
          items.some(it => it.category === '지정' || it.category === '학교지정') ||
          ['스포츠문화', '스포츠과학', '스포츠생활', '운동과건강'].some(k => normSubj.includes(k) || k.includes(normSubj))
        ) {
          // 2·3학년 학교지정(공통) 및 전체 수강 과목 (스포츠 문화, 스포츠 과학 등):
          // 전체가 듣는 과목은 수강신청 인원이 아니라 [사전데이터(priorData.students)] 기준!
          const priorStudents = yData[gradeStr]?.priorData?.students;
          const wholeGradeStudents = (priorStudents && priorStudents.length > 0) ? priorStudents : students;
          const defaultTotal = (gradeStr === '2학년' ? 44 : 19);
          const totalCount = wholeGradeStudents.length || defaultTotal;
          const numClasses = parseInt(classCounts[gradeStr] || 2, 10) || 2;

          if (items.length > 1) {
            items.forEach((it, itIdx) => {
              let classTarget = it.division || '';
              if (!classTarget || classTarget === '선택') {
                classTarget = `${itIdx + 1}반`;
              }
              const classNum = classTarget.replace(/[^0-9]/g, '') || String(itIdx + 1);
              const classStudents = wholeGradeStudents.filter(st => String(st.classNum).replace(/[^0-9]/g, '') === classNum);
              const labels = classStudents.map(st => `${st.studentNum ? st.studentNum + '번 ' : ''}${st.name || '학생'}`.trim());
              labels.sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));

              const cCount = classStudents.length > 0 ? `${classStudents.length}명` : `${Math.floor(totalCount / items.length)}명`;
              const cRoster = labels.length > 0 ? labels.join(', ') : `전원 배정 (${classTarget})`;

              rows.push([
                `${sem}학기`,
                gradeStr,
                `${subjName} (${totalCount}명)`,
                classTarget,
                cCount,
                cRoster,
                publisher,
                it.teacher || '-'
              ]);
              currentTeachers.push(it.teacher || '-');
              const lineCount = Math.ceil((cRoster.length || 1) / 50);
              rowHeights.push({ hpt: Math.max(24, Math.min(90, 20 + lineCount * 13)) });
              rowStyleInfo.push({ isClosed: false, isEven });
            });
          } else {
            // 단일 행으로 들어온 경우: 각 반(1반, 2반...)으로 분리
            for (let cIdx = 1; cIdx <= numClasses; cIdx++) {
              const cNum = String(cIdx);
              const classStudents = wholeGradeStudents.filter(st => String(st.classNum).replace(/[^0-9]/g, '') === cNum);
              const labels = classStudents.map(st => `${st.studentNum ? st.studentNum + '번 ' : ''}${st.name || '학생'}`.trim());
              labels.sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));

              const cCount = classStudents.length > 0 ? `${classStudents.length}명` : `${Math.floor(totalCount / numClasses)}명`;
              const cRoster = labels.length > 0 ? labels.join(', ') : `전원 배정 (${cIdx}반)`;
              const tName = representative.teacher || '-';

              rows.push([
                `${sem}학기`,
                gradeStr,
                `${subjName} (${totalCount}명)`,
                `${cIdx}반`,
                cCount,
                cRoster,
                publisher,
                tName
              ]);
              currentTeachers.push(tName);
              const lineCount = Math.ceil((cRoster.length || 1) / 50);
              rowHeights.push({ hpt: Math.max(24, Math.min(90, 20 + lineCount * 13)) });
              rowStyleInfo.push({ isClosed: false, isEven });
            }
          }
        } else {
          // 2·3학년 선택 과목
          const enrolled = students.filter(st => {
            const choices = (sem === 1 ? st.sem1 : st.sem2) || [];
            return choices.some(ch => {
              if (!ch) return false;
              if (ch === subjName || ch === baseSubj) return true;
              return normalizeSubjectKey(ch) === normSubj || normalizeSubjectForPublisher(ch) === normSubj;
            });
          });

          const totalEnrolled = enrolled.length;
          const totalSubjText = `${subjName} (${totalEnrolled}명)`;

          if (totalEnrolled === 0) {
            const tName = representative.teacher || '-';
            rows.push([
              `${sem}학기`,
              gradeStr,
              totalSubjText,
              representative.division || '선택',
              '0명',
              '-',
              publisher,
              tName
            ]);
            currentTeachers.push(tName);
            rowHeights.push({ hpt: 24 });
            rowStyleInfo.push({ isClosed: false, isEven });
          } else {
            // 학생들의 원적 학급별 수집 (1반, 2반, 3반...)
            const classMap = new Map();
            enrolled.forEach(st => {
              const cNum = String(st.classNum || '1');
              if (!classMap.has(cNum)) classMap.set(cNum, []);
              const label = `${st.studentNum ? st.studentNum + '번 ' : ''}${st.name || '학생'}`.trim();
              classMap.get(cNum).push(label);
            });

            const sortedClasses = Array.from(classMap.keys()).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

            if (items.length > 1 && items.some(it => it.division && it.division !== '선택')) {
              items.forEach(it => {
                const cNum = it.division.replace(/[^0-9]/g, '');
                const cLabels = classMap.get(cNum) || [];
                cLabels.sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));

                const cText = `${cLabels.length}명`;
                const rText = cLabels.length > 0 ? cLabels.join(', ') : '-';
                rows.push([
                  `${sem}학기`,
                  gradeStr,
                  totalSubjText,
                  it.division,
                  cText,
                  rText,
                  publisher,
                  it.teacher || '-'
                ]);
                currentTeachers.push(it.teacher || '-');
                rowHeights.push({ hpt: Math.max(24, Math.min(90, 20 + Math.ceil(rText.length / 50) * 13)) });
                rowStyleInfo.push({ isClosed: false, isEven });
              });
            } else {
              // 일반 선택과목: 1반, 2반 수강 학생별로 각각 행 분리 생성!
              sortedClasses.forEach(cNum => {
                const cLabels = classMap.get(cNum) || [];
                cLabels.sort((a, b) => a.localeCompare(b, 'ko', { numeric: true }));

                const tName = representative.teacher || '-';
                const cText = `${cLabels.length}명`;
                const rText = cLabels.join(', ');

                rows.push([
                  `${sem}학기`,
                  gradeStr,
                  totalSubjText,
                  `${cNum}반`,
                  cText,
                  rText,
                  publisher,
                  tName
                ]);
                currentTeachers.push(tName);
                rowHeights.push({ hpt: Math.max(24, Math.min(90, 20 + Math.ceil(rText.length / 50) * 13)) });
                rowStyleInfo.push({ isClosed: false, isEven });
              });
            }
          }
        }

        const courseEndRow = rows.length - 1;
        if (courseStartRow <= courseEndRow) {
          courseMergeRanges.push({
            startRow: courseStartRow,
            endRow: courseEndRow,
            teachers: currentTeachers
          });
        }
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);

      // 셀 병합 (Merge) 설정
      courseMergeRanges.forEach(grp => {
        const sR = grp.startRow;
        const eR = grp.endRow;
        if (sR < eR) {
          // 0: 학기 병합
          wsMerges.push({ s: { r: sR, c: 0 }, e: { r: eR, c: 0 } });
          // 1: 학년 병합
          wsMerges.push({ s: { r: sR, c: 1 }, e: { r: eR, c: 1 } });
          // 2: 과목명(총원) 병합
          wsMerges.push({ s: { r: sR, c: 2 }, e: { r: eR, c: 2 } });
          // 6: 출판사 병합
          wsMerges.push({ s: { r: sR, c: 6 }, e: { r: eR, c: 6 } });

          // 7: 담당 교사 (모든 행의 담당 교사가 동일한 경우 병합)
          const allSameTeacher = grp.teachers.every(t => t === grp.teachers[0]);
          if (allSameTeacher && grp.teachers[0] && grp.teachers[0] !== '-') {
            wsMerges.push({ s: { r: sR, c: 7 }, e: { r: eR, c: 7 } });
          }
        }
      });

      ws['!merges'] = wsMerges;

      // 열 너비 설정 (총 8개 열)
      ws['!cols'] = [
        { wch: 10 },  // 0: 학기
        { wch: 10 },  // 1: 학년
        { wch: 26 },  // 2: 과목명(총원)
        { wch: 10 },  // 3: 반
        { wch: 12 },  // 4: 수강인원
        { wch: 70 },  // 5: 수강자 명단
        { wch: 16 },  // 6: 출판사
        { wch: 14 }   // 7: 담당 교사
      ];

      ws['!rows'] = rowHeights;

      // 4행(학기, 학년, 과목명, 반, 수강인원, 수강자 명단, 출판사, 담당 교사) 자동 필터 적용
      ws['!autofilter'] = { ref: `A4:H${rows.length}` };

      // 4행 헤더 기준 틀고정 (1~4행 고정)
      ws['!freeze'] = { ySplit: 4, topLeftCell: 'A5' };
      ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 4, topLeftCell: 'A5', activeCell: 'A5' }];

      // 파스텔 톤 엑셀 정밀 서식 적용 (8열 확장)
      if (typeof ExcelStyler !== 'undefined') {
        const pastelTheme = {
          titleBg: 'EEF2FF',
          titleText: '1E3A8A',
          subBg: 'F8FAFC',
          subText: '64748B',
          headerBg: 'E0E7FF',
          headerText: '1E3A8A',
          rowEven: 'F8FAFC',
          rowOdd: 'FFFFFF',
          borderSoft: 'CBD5E1',
          borderHeader: 'A5B4FC',
          closedBg: 'FEE2E2',
          closedText: 'DC2626',
          pubText: '3730A3',
          classText: '0F766E'
        };

        const softBorder = {
          top: { style: 'thin', color: { rgb: pastelTheme.borderSoft } },
          bottom: { style: 'thin', color: { rgb: pastelTheme.borderSoft } },
          left: { style: 'thin', color: { rgb: pastelTheme.borderSoft } },
          right: { style: 'thin', color: { rgb: pastelTheme.borderSoft } }
        };

        // Title Row (0)
        ExcelStyler.setRange(ws, 0, 0, 0, 7, {
          font: { name: ExcelStyler.fontFamily, sz: 14, bold: true, color: { rgb: pastelTheme.titleText } },
          fill: { fgColor: { rgb: pastelTheme.titleBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '93C5FD' } },
            bottom: { style: 'thin', color: { rgb: pastelTheme.borderSoft } },
            left: { style: 'thin', color: { rgb: pastelTheme.borderSoft } },
            right: { style: 'thin', color: { rgb: pastelTheme.borderSoft } }
          }
        });

        // Subtitle Row (1)
        ExcelStyler.setRange(ws, 1, 0, 1, 7, {
          font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: pastelTheme.subText } },
          fill: { fgColor: { rgb: pastelTheme.subBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: pastelTheme.borderSoft } },
            bottom: { style: 'medium', color: { rgb: '93C5FD' } },
            left: { style: 'thin', color: { rgb: pastelTheme.borderSoft } },
            right: { style: 'thin', color: { rgb: pastelTheme.borderSoft } }
          }
        });

        // Header Row (3)
        for (let c = 0; c < 8; c++) {
          ExcelStyler.setCell(ws, 3, c, {
            font: { name: ExcelStyler.fontFamily, sz: 10.5, bold: true, color: { rgb: pastelTheme.headerText } },
            fill: { fgColor: { rgb: pastelTheme.headerBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'medium', color: { rgb: pastelTheme.borderHeader } },
              bottom: { style: 'medium', color: { rgb: pastelTheme.borderHeader } },
              left: { style: 'thin', color: { rgb: pastelTheme.borderSoft } },
              right: { style: 'thin', color: { rgb: pastelTheme.borderSoft } }
            }
          });
        }

        // Data Rows (4부터 끝까지)
        for (let r = 4; r < rows.length; r++) {
          const styleMeta = rowStyleInfo[r - 4] || { isClosed: false, isEven: true };
          const isClosedRow = styleMeta.isClosed;
          const baseBg = isClosedRow ? pastelTheme.closedBg : (styleMeta.isEven ? pastelTheme.rowEven : pastelTheme.rowOdd);
          const textColor = isClosedRow ? pastelTheme.closedText : '1E293B';
          const pubVal = rows[r][6];

          // 0: 학기
          ExcelStyler.setCell(ws, r, 0, {
            font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: textColor } },
            fill: { fgColor: { rgb: baseBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: softBorder
          });

          // 1: 학년
          ExcelStyler.setCell(ws, r, 1, {
            font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: textColor } },
            fill: { fgColor: { rgb: baseBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: softBorder
          });

          // 2: 과목명(총원)
          ExcelStyler.setCell(ws, r, 2, {
            font: { name: ExcelStyler.fontFamily, sz: 9.5, bold: true, strike: isClosedRow, color: { rgb: textColor } },
            fill: { fgColor: { rgb: baseBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: softBorder
          });

          // 3: 반
          ExcelStyler.setCell(ws, r, 3, {
            font: { name: ExcelStyler.fontFamily, sz: 9.5, bold: true, color: { rgb: isClosedRow ? textColor : pastelTheme.classText } },
            fill: { fgColor: { rgb: baseBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: softBorder
          });

          // 4: 수강인원
          ExcelStyler.setCell(ws, r, 4, {
            font: { name: ExcelStyler.fontFamily, sz: 9.5, bold: true, color: { rgb: textColor } },
            fill: { fgColor: { rgb: baseBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: softBorder
          });

          // 5: 수강자 명단
          ExcelStyler.setCell(ws, r, 5, {
            font: { name: ExcelStyler.fontFamily, sz: 9.5, color: { rgb: textColor } },
            fill: { fgColor: { rgb: baseBg } },
            alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
            border: softBorder
          });

          // 6: 출판사
          ExcelStyler.setCell(ws, r, 6, {
            font: { name: ExcelStyler.fontFamily, sz: 9.5, bold: !!pubVal, color: { rgb: pubVal ? pastelTheme.pubText : textColor } },
            fill: { fgColor: { rgb: baseBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: softBorder
          });

          // 7: 담당 교사
          ExcelStyler.setCell(ws, r, 7, {
            font: { name: ExcelStyler.fontFamily, sz: 9.5, bold: true, color: { rgb: textColor } },
            fill: { fgColor: { rgb: baseBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: softBorder
          });
        }
      }

      return { ws, count: rows.length - 4 };
    }

    // ==========================================
    // 📊 종합 엑셀 다운로드 (교사별 시수 종합 + 전학년 과목 배정 상세 + 과목 기준 데이터 정리)
    // ==========================================
    function exportAllGradesConsolidatedExcel() {
      const curriculum = getAllGradesCurriculum();
      if (curriculum.length === 0) {
        alert('내보낼 기초데이터 과목이 없습니다.');
        return;
      }

      const year = MultiState?.activeYear || '2027';
      const wb = XLSX.utils.book_new();

      // Sheet 1: 교사별 시수 종합표 (파스텔톤 정밀 서식 적용, 반 구분 및 순수 시수 숫자 연동)
      const { ws: ws1 } = createTeacherWorkloadSheet(curriculum, year);
      XLSX.utils.book_append_sheet(wb, ws1, '교사별_시수_종합');

      // Sheet 2: 전학년 과목별 배정 상세 (반 구분, 출판사, 담당교사 포함)
      const detailRows = curriculum.map((c, idx) => ({
        '연번': idx + 1,
        '학년': c.grade,
        '학기': `${c.semester}학기`,
        '구분': c.category,
        '반 구분': (c.division || (c.category === '선택' ? '선택' : '1반')).trim(),
        '과목명': c.subject,
        '총 시수': c.hours,
        '출판사': getPublisherForSubject(c.subject) || '-',
        '개설상태': c.status,
        '담당교사': c.teacher,
        '수정여부': c.isModified ? '수정됨' : '원본',
        '최초원래교사': c.originalTeacher
      }));

      const ws2 = XLSX.utils.json_to_sheet(detailRows);
      ws2['!cols'] = [
        { wch: 6 },   // 연번
        { wch: 10 },  // 학년
        { wch: 10 },  // 학기
        { wch: 10 },  // 구분
        { wch: 10 },  // 반 구분
        { wch: 22 },  // 과목명
        { wch: 10 },  // 총 시수
        { wch: 16 },  // 출판사
        { wch: 10 },  // 개설상태
        { wch: 14 },  // 담당교사
        { wch: 10 },  // 수정여부
        { wch: 14 }   // 최초원래교사
      ];
      XLSX.utils.book_append_sheet(wb, ws2, '전학년_과목_배정_상세');

      // Sheet 3: 과목 기준 데이터 정리 (반별 행 분리, 과목명(총원), 분반 처리 및 셀 병합)
      try {
        const { ws: ws3 } = createSubjectBasedWorksheet();
        if (ws3) {
          XLSX.utils.book_append_sheet(wb, ws3, '과목_기준_데이터_정리');
        }
      } catch (err) {
        console.warn('과목 기준 데이터 정리 시트 생성 중 오류:', err);
      }

      const allGradesFileName = buildExportFileName("전학년 교사별시수 및 과목배정 종합", "xlsx");
      window.saveExcelFile(wb, allGradesFileName);
    }

    // ==========================================
    // 📋 과목 기준 데이터 정리 엑셀 다운로드 (단독 전용)
    // ==========================================
    function exportSubjectBasedExcel() {
      const { ws } = createSubjectBasedWorksheet();
      if (!ws) {
        alert('내보낼 과목 데이터가 없습니다. 기초데이터 엑셀을 업로드하거나 수강신청 조사를 등록해주세요.');
        return;
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '과목_기준_데이터_정리');

      const fileName = buildExportFileName('과목 기준 데이터 정리', 'xlsx');
      window.saveExcelFile(wb, fileName);
    }
    window.exportSubjectBasedExcel = exportSubjectBasedExcel;
    window.parsePublisherExcel = parsePublisherExcel;
    window.updatePublisherButtonUI = updatePublisherButtonUI;

    function renderAllGradesDashboard(fullRedraw = true) {
      if (typeof updatePublisherButtonUI === 'function') updatePublisherButtonUI();
      if (typeof updateGradeClassCountBadge === 'function') updateGradeClassCountBadge();
      const curriculum = getAllGradesCurriculum();

      // 과거 별표/특수문자 불일치 등으로 자동 폐강 처리되었던 과목 자동 복원 동기화
      let needsSync = false;
      curriculum.forEach(item => {
        if (item.category === '지정' || item.category === '학교지정' || item.grade === '1학년') {
          if (item.status === '폐강') {
            item.status = '개설';
            if (item.teacher === '폐강') item.teacher = item.originalTeacher || '';
            needsSync = true;
          }
          return;
        }
        if (item.status === '폐강' && !item.isModified) {
          const normSubj = normalizeSubjectKey(item.subject);
          const sem = item.semester;
          const openedSet = getStep2OpenedSubjects(MultiState.activeYear, item.grade, sem);
          if (openedSet !== null) {
            if ([...openedSet].some(s => normalizeSubjectKey(s) === normSubj)) {
              item.status = '개설';
              if (item.teacher === '폐강') item.teacher = item.originalTeacher || '';
              needsSync = true;
            }
          } else {
            const gData = getAcadData()[MultiState.activeYear]?.[item.grade];
            let semSubjs = (sem === 1 ? gData?.sem1Subjects : gData?.sem2Subjects) || [];
            if (!semSubjs || semSubjs.length === 0) {
              const semKey = (sem === 1 ? 'sem1' : 'sem2');
              const set = new Set();
              (gData?.students || []).forEach(st => {
                (st[semKey] || []).forEach(s => { if (s && s.trim()) set.add(s.trim()); });
              });
              semSubjs = Array.from(set);
            }
            if (semSubjs.length > 0) {
              const inSurvey = semSubjs.some(s => normalizeSubjectKey(s) === normSubj);
              const closedList = gData?.closedSubjects?.[sem] || [];
              const isClosedInStep1 = closedList.some(s => normalizeSubjectKey(s) === normSubj);
              if (inSurvey && !isClosedInStep1) {
                item.status = '개설';
                if (item.teacher === '폐강') item.teacher = item.originalTeacher || '';
                needsSync = true;
              }
            }
          }
        }
      });
      if (needsSync) {
        setAllGradesCurriculum(curriculum);
      }

      // Check for missing open subjects from 2, 3학년
      checkMissingOpenSubjectsInCurriculum(curriculum);

      // Metric calculations
      const teacherSet = new Set();
      let sem1Hours = 0;
      let sem2Hours = 0;
      let closedCount = 0;

      curriculum.forEach(c => {
        if (c.status === '폐강') {
          closedCount++;
        } else {
          if (c.teacher && c.teacher !== '폐강') {
            teacherSet.add(c.teacher);
          }
          if (c.semester === 1) sem1Hours += (c.hours || 0);
          if (c.semester === 2) sem2Hours += (c.hours || 0);
        }
      });

      const statTeacher = document.getElementById('statAllGradesTeacherCount');
      const statSem1 = document.getElementById('statAllGradesSem1Hours');
      const statSem2 = document.getElementById('statAllGradesSem2Hours');
      const statClosed = document.getElementById('statAllGradesClosedCount');
      const teacherBadge = document.getElementById('allGradesTeacherBadge');
      const courseBadge = document.getElementById('allGradesCourseBadge');

      if (statTeacher) statTeacher.textContent = `${teacherSet.size}명`;
      if (statSem1) statSem1.textContent = `${sem1Hours}시간`;
      if (statSem2) statSem2.textContent = `${sem2Hours}시간`;
      if (statClosed) statClosed.textContent = `${closedCount}개`;
      if (teacherBadge) teacherBadge.textContent = `총 ${teacherSet.size}명 배정`;
      if (courseBadge) courseBadge.textContent = `총 ${curriculum.length}과목 (개설 ${curriculum.length - closedCount} / 폐강 ${closedCount})`;

      window.updateUnassignedTeacherBadgeState();

      renderAllGradesTeacherSummary();
      if (fullRedraw) {
        renderAllGradesCurriculumTable();
      }
    }

    // ==========================================
    // TEACHER SUMMARY ORDER & DRAG-AND-DROP
    // ==========================================
    let draggedTeacherName = null;
    let teacherOrderWorkingList = [];
    let teacherOrderOriginalList = [];
    let teacherOrderModalDraggedName = null;

    function getTeacherStatsMap() {
      const curriculum = getAllGradesCurriculum();
      const map = {};
      curriculum.forEach(item => {
        if (item.status === '폐강') return;
        const t = (item.teacher || '').trim();
        if (!t || t === '폐강') return;

        if (!map[t]) {
          map[t] = { sem1: 0, sem2: 0, total: 0 };
        }
        const h = item.hours || 0;
        if (item.semester === 1) map[t].sem1 += h;
        else map[t].sem2 += h;
        map[t].total += h;
      });
      return map;
    }

    // 교사 목록 정렬 함수 (사용자 지정 순서 1순위, 나머지 가나다순 2순위, 모든 탭 전역 공유)
    window.getCurrentTeacherSummaryList = function() {
      const teacherMap = getTeacherStatsMap();
      const customOrder = (MultiState && Array.isArray(MultiState.customTeacherOrder))
        ? MultiState.customTeacherOrder
        : getTeacherOrder();
      const allTeachers = Object.keys(teacherMap);

      if (customOrder.length > 0) {
        const inOrder = customOrder.filter(name => allTeachers.includes(name));
        const notInOrder = allTeachers.filter(name => !customOrder.includes(name)).sort((a, b) => a.localeCompare(b, 'ko'));
        return [...inOrder, ...notInOrder];
      } else {
        // 기본 정렬: 가나다순
        return allTeachers.sort((a, b) => a.localeCompare(b, 'ko'));
      }
    };

    window.addTeacherFromDirectInput = function() {
      const input = document.getElementById('teacherOrderDirectInput');
      if (!input) return;
      const tName = (input.value || '').trim();
      if (!tName) return;

      const currentOrder = Array.from(document.querySelectorAll('#teacherOrderListContainer [data-teacher]'))
        .map(el => el.getAttribute('data-teacher'))
        .filter(Boolean);

      if (currentOrder.includes(tName)) {
        alert(`[${tName}] 교사는 이미 순서 목록에 포함되어 있습니다.`);
        input.value = '';
        input.focus();
        return;
      }

      currentOrder.push(tName);
      buildTeacherOrderModalInitialDOM(currentOrder);
      renderTeacherModalChips(currentOrder);
      input.value = '';
      input.focus();

      const container = document.getElementById('teacherOrderListContainer');
      if (container) container.scrollTop = container.scrollHeight;
    };

    window.addTeacherToOrderFromChip = function(tName) {
      const currentOrder = Array.from(document.querySelectorAll('#teacherOrderListContainer [data-teacher]'))
        .map(el => el.getAttribute('data-teacher'))
        .filter(Boolean);

      if (currentOrder.includes(tName)) {
        const updated = currentOrder.filter(t => t !== tName);
        buildTeacherOrderModalInitialDOM(updated);
        renderTeacherModalChips(updated);
      } else {
        currentOrder.push(tName);
        buildTeacherOrderModalInitialDOM(currentOrder);
        renderTeacherModalChips(currentOrder);
      }
    };

    window.removeTeacherFromOrderModal = function(tName, event) {
      if (event) event.stopPropagation();
      const currentOrder = Array.from(document.querySelectorAll('#teacherOrderListContainer [data-teacher]'))
        .map(el => el.getAttribute('data-teacher'))
        .filter(Boolean);

      const updated = currentOrder.filter(t => t !== tName);
      buildTeacherOrderModalInitialDOM(updated);
      renderTeacherModalChips(updated);
    };

    window.clearCustomTeacherOrder = function() {
      if (!confirm('지정된 교사 정렬 순서를 초기화하고 가나다 기본순으로 되돌리시겠습니까?')) return;
      setTeacherOrder([]);
      const allList = window.getCurrentTeacherSummaryList();
      buildTeacherOrderModalInitialDOM(allList);
      renderTeacherModalChips([]);
      renderAllGradesTeacherSummary();
      alert('🔄 교사 정렬 순서가 초기화되었습니다 (가나다 기본순).');
    };

    function renderTeacherModalChips(currentOrdered = []) {
      const chipsContainer = document.getElementById('teacherModalChipsContainer');
      const countBadge = document.getElementById('teacherChipsAvailableCount');
      if (!chipsContainer) return;

      const curriculum = getAllGradesCurriculum();
      const allTeachersSet = new Set();
      curriculum.forEach(c => {
        if (c.teacher && c.teacher !== '폐강' && c.teacher !== '미배정') {
          allTeachersSet.add(c.teacher.trim());
        }
      });

      const allTeachers = Array.from(allTeachersSet).sort((a, b) => a.localeCompare(b, 'ko'));
      if (countBadge) countBadge.textContent = `총 ${allTeachers.length}명`;

      if (allTeachers.length === 0) {
        chipsContainer.innerHTML = '<span class="text-xs text-slate-400 italic">편제표에 등록된 담당 교사가 없습니다.</span>';
        return;
      }

      chipsContainer.innerHTML = allTeachers.map(t => {
        const isIncluded = currentOrdered.includes(t);
        const orderIdx = isIncluded ? (currentOrdered.indexOf(t) + 1) : null;
        return `
          <button type="button" 
                  onclick="window.addTeacherToOrderFromChip('${escapeHtml(t)}')"
                  class="px-2 py-0.5 rounded-lg text-xs font-bold transition border cursor-pointer flex items-center gap-1 select-none ${
                    isIncluded 
                      ? 'bg-indigo-100 text-indigo-900 border-indigo-300 ring-1 ring-indigo-300' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                  }"
                  title="${isIncluded ? `${orderIdx}번째 순서로 지정됨 (클릭 시 순서에서 제거)` : '클릭하여 순서에 추가'}">
            <span>${isIncluded ? `✓ ${orderIdx}. ` : '+ '}${escapeHtml(t)}</span>
          </button>
        `;
      }).join('');
    }

    // ==========================================
    // TEACHER ORDER MODAL (Pure DOM Drag & Excel-style Shift Insertion)
    // ==========================================
    let modalDraggedEl = null;
    let modalInsertTargetEl = null;
    let modalInsertPos = 'before'; // 'before' | 'after'
    let modalCachedStats = {};
    let modalOriginalSnapshotHTML = '';

    function getTeacherStatsMap() {
      const curriculum = getAllGradesCurriculum();
      const map = {};
      curriculum.forEach(item => {
        if (item.status === '폐강') return;
        const t = (item.teacher || '').trim();
        if (!t || t === '폐강') return;

        if (!map[t]) {
          map[t] = { sem1: 0, sem2: 0, total: 0 };
        }
        const h = item.hours || 0;
        if (item.semester === 1) map[t].sem1 += h;
        else map[t].sem2 += h;
        map[t].total += h;
      });
      return map;
    }

    window.getCurrentTeacherSummaryList = function() {
      const teacherMap = getTeacherStatsMap();
      const customOrder = getTeacherOrder();
      const allTeachers = Object.keys(teacherMap);

      if (customOrder.length > 0) {
        allTeachers.sort((a, b) => {
          const idxA = customOrder.indexOf(a);
          const idxB = customOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          const totA = teacherMap[a]?.total || 0;
          const totB = teacherMap[b]?.total || 0;
          return totB - totA || a.localeCompare(b, 'ko');
        });
      } else {
        allTeachers.sort((a, b) => {
          const totA = teacherMap[a]?.total || 0;
          const totB = teacherMap[b]?.total || 0;
          return totB - totA || a.localeCompare(b, 'ko');
        });
      }
      return allTeachers;
    };

    // --- Modal Open & Close ---
    window.openTeacherOrderModal = function() {
      const list = window.getCurrentTeacherSummaryList();
      if (list.length === 0) {
        alert('정렬할 교사 데이터가 없습니다. 먼저 기초데이터 엑셀을 업로드하거나 예시데이터를 불러와주세요.');
        return;
      }

      modalCachedStats = getTeacherStatsMap();
      const searchInput = document.getElementById('teacherOrderModalSearch');
      if (searchInput) searchInput.value = '';

      // 최초 DOM 목록 생성 및 교사 칩 렌더링
      const customOrder = (MultiState && MultiState.customTeacherOrder && Array.isArray(MultiState.customTeacherOrder))
        ? [...MultiState.customTeacherOrder]
        : [];
      buildTeacherOrderModalInitialDOM(customOrder);
      renderTeacherModalChips(customOrder);

      // 직접 입력창 엔터키 리스너 바인딩
      const directInput = document.getElementById('teacherOrderDirectInput');
      if (directInput) {
        directInput.value = '';
        directInput.onkeydown = function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            window.addTeacherFromDirectInput();
          }
        };
      }

      // 취소 복원용 스냅샷 저장
      const container = document.getElementById('teacherOrderListContainer');
      modalOriginalSnapshotHTML = container ? container.innerHTML : '';

      // 컨테이너 드래그오버 & 드롭 리스너 바인딩
      bindModalContainerEvents();

      document.getElementById('teacherOrderModal')?.classList.remove('hidden');
    };

    window.closeTeacherOrderModal = function() {
      document.getElementById('teacherOrderModal')?.classList.add('hidden');
      hideDropLine();
      modalDraggedEl = null;
    };

    // --- 적용하기: 화면에 놓인 순서대로 최종 저장 ---
    window.applyTeacherOrderModal = function() {
      const container = document.getElementById('teacherOrderListContainer');
      if (!container) return;

      const finalOrder = Array.from(container.querySelectorAll('[data-teacher]'))
        .map(el => el.getAttribute('data-teacher'))
        .filter(Boolean);

      setTeacherOrder(finalOrder);
      renderAllGradesTeacherSummary();
      window.closeTeacherOrderModal();
      alert(`✅ 교사 순서 [총 ${finalOrder.length}명]가 성공적으로 적용 및 저장되었습니다!\n(지정된 교사 우선 ➔ 미지정 교사는 가나다순으로 자동 배치됩니다)`);
    };

    window.setCustomTeacherOrderList = function(finalOrder) {
      setTeacherOrder(finalOrder);
      renderAllGradesTeacherSummary();
    };

    window.resetTeacherOrderModalList = function() {
      const container = document.getElementById('teacherOrderListContainer');
      if (container && modalOriginalSnapshotHTML) {
        container.innerHTML = modalOriginalSnapshotHTML;
        updateModalVisualIndexes();
      }
    };

    // 최초 1회만 DOM을 가볍게 생성
    function buildTeacherOrderModalInitialDOM(teacherList) {
      const container = document.getElementById('teacherOrderListContainer');
      if (!container) return;

      const dropLine = document.getElementById('teacherOrderDropLine');
      const dropLineHTML = dropLine ? dropLine.outerHTML : `
        <div id="teacherOrderDropLine" class="hidden pointer-events-none absolute left-1 right-1 z-30 flex items-center transition-all duration-75" style="transform: translateY(-50%);">
          <div class="w-3.5 h-3.5 rounded-full bg-indigo-600 shadow-md ring-2 ring-white flex items-center justify-center text-[9px] text-white font-black shrink-0">◀</div>
          <div class="flex-1 h-[3px] bg-indigo-600 rounded-full shadow-md"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-indigo-600 shadow-md ring-2 ring-white flex items-center justify-center text-[9px] text-white font-black shrink-0">▶</div>
        </div>
      `;

      if (!teacherList || teacherList.length === 0) {
        container.innerHTML = dropLineHTML + `
          <div id="teacherOrderEmptyState" class="p-8 text-center text-slate-400 text-xs select-none">
            <span class="block text-2xl mb-1">✍️</span>
            <span class="font-bold text-slate-600 text-sm">지정된 우선 순위 교사가 없습니다.</span><br>
            위 입력창에서 <b>교사명을 입력하고 Enter</b>를 누르거나,<br>
            아래 <b>[전체 교사 목록 정보]</b>에서 교사를 클릭하여 원하는 순서를 등록하세요.<br>
            <span class="text-indigo-600 font-semibold mt-1 inline-block">※ 지정되지 않은 교사는 가나다순(ㄱ-ㅎ)으로 뒤에 자동 배치됩니다.</span>
          </div>
        `;
        const countBadge = document.getElementById('teacherOrderModalCountBadge');
        if (countBadge) countBadge.textContent = '총 0명 지정';
        return;
      }

      const cardsHTML = teacherList.map((tName, idx) => {
        const info = modalCachedStats[tName] || { sem1: 0, sem2: 0, total: 0 };
        return `
          <div class="teacher-order-card flex items-center justify-between p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all select-none cursor-grab active:cursor-grabbing group shadow-2xs relative"
               draggable="true"
               data-teacher="${escapeHtml(tName)}"
               data-total="${info.total}"
               ondragstart="window.handleModalDragStart(event)"
               ondragend="window.handleModalDragEnd(event)">
            
            <div class="flex items-center gap-2.5 min-w-0 pointer-events-none">
              <span class="text-slate-400 group-hover:text-indigo-600 font-black text-sm select-none shrink-0" title="위아래로 드래그하여 끼워넣기">⠿</span>
              <span class="order-idx-badge w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-slate-200">${idx + 1}</span>
              <span class="font-extrabold text-sm text-slate-900 truncate">${escapeHtml(tName)}</span>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span class="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 pointer-events-none">
                1학기 <b class="text-blue-700">${info.sem1}h</b> · 2학기 <b class="text-emerald-700">${info.sem2}h</b> · <b class="text-indigo-700 font-black">${info.total}h</b>
              </span>
              <div class="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button type="button" onclick="window.moveTeacherOrderModalItem('${escapeHtml(tName)}', 'top')" class="p-1 text-[11px] text-slate-500 hover:text-indigo-600 hover:bg-white rounded transition cursor-pointer" title="맨 위로 이동">⏫</button>
                <button type="button" onclick="window.moveTeacherOrderModalItem('${escapeHtml(tName)}', 'up')" class="p-1 text-[11px] text-slate-500 hover:text-indigo-600 hover:bg-white rounded transition cursor-pointer" title="한 칸 위로 이동">▲</button>
                <button type="button" onclick="window.moveTeacherOrderModalItem('${escapeHtml(tName)}', 'down')" class="p-1 text-[11px] text-slate-500 hover:text-indigo-600 hover:bg-white rounded transition cursor-pointer" title="한 칸 아래로 이동">▼</button>
                <button type="button" onclick="window.moveTeacherOrderModalItem('${escapeHtml(tName)}', 'bottom')" class="p-1 text-[11px] text-slate-500 hover:text-indigo-600 hover:bg-white rounded transition cursor-pointer" title="맨 아래로 이동">⏬</button>
                <button type="button" onclick="window.removeTeacherFromOrderModal('${escapeHtml(tName)}', event)" class="p-1 text-[11px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer font-bold" title="순서에서 제거">✕</button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = dropLineHTML + cardsHTML;
      updateModalVisualIndexes();
    }

    // 순수 번호 텍스트(1, 2, 3...)만 빠르게 갱신 (0.1ms 소요)
    function updateModalVisualIndexes() {
      const container = document.getElementById('teacherOrderListContainer');
      const badge = document.getElementById('teacherOrderModalCountBadge');
      if (!container) return;

      const cards = container.querySelectorAll('.teacher-order-card');
      let visibleCount = 0;
      cards.forEach((card) => {
        if (card.style.display !== 'none') {
          visibleCount++;
          const idxEl = card.querySelector('.order-idx-badge');
          if (idxEl) idxEl.textContent = visibleCount;
        }
      });
      if (badge) badge.textContent = `총 ${cards.length}명 지정`;
    }

    // --- 엑셀 Shift 드래그 스타일의 실시간 삽입 라인 표시 및 드래그앤드롭 ---
    function bindModalContainerEvents() {
      const container = document.getElementById('teacherOrderListContainer');
      if (!container || container.dataset.dragEventsBound) return;
      container.dataset.dragEventsBound = 'true';

      container.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!modalDraggedEl) return;

        const dropLine = document.getElementById('teacherOrderDropLine');
        if (!dropLine) return;

        const cards = Array.from(container.querySelectorAll('.teacher-order-card')).filter(c => c !== modalDraggedEl && c.style.display !== 'none');
        if (cards.length === 0) return;

        const mouseY = e.clientY;
        let closestCard = null;
        let closestDist = Infinity;
        let insertBefore = true;

        for (const card of cards) {
          const rect = card.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          const dist = Math.abs(mouseY - midY);
          if (dist < closestDist) {
            closestDist = dist;
            closestCard = card;
            insertBefore = (mouseY < midY);
          }
        }

        if (closestCard) {
          modalInsertTargetEl = closestCard;
          modalInsertPos = insertBefore ? 'before' : 'after';

          const cardRect = closestCard.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const targetY = insertBefore
            ? (cardRect.top - containerRect.top + container.scrollTop)
            : (cardRect.bottom - containerRect.top + container.scrollTop);

          dropLine.style.top = targetY + 'px';
          dropLine.classList.remove('hidden');
        }
      });

      container.addEventListener('dragleave', (e) => {
        if (!container.contains(e.relatedTarget)) {
          hideDropLine();
        }
      });

      container.addEventListener('drop', (e) => {
        e.preventDefault();
        hideDropLine();

        if (!modalDraggedEl || !modalInsertTargetEl) return;
        if (modalDraggedEl === modalInsertTargetEl) return;

        // 순수 DOM 이동 (insertBefore) - 지연 0ms
        if (modalInsertPos === 'before') {
          container.insertBefore(modalDraggedEl, modalInsertTargetEl);
        } else {
          container.insertBefore(modalDraggedEl, modalInsertTargetEl.nextElementSibling);
        }

        updateModalVisualIndexes();
        modalDraggedEl = null;
        modalInsertTargetEl = null;
      });
    }

    function hideDropLine() {
      const dropLine = document.getElementById('teacherOrderDropLine');
      if (dropLine) dropLine.classList.add('hidden');
    }

    window.handleModalDragStart = function(e) {
      modalDraggedEl = e.currentTarget;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', modalDraggedEl.dataset.teacher || '');
      setTimeout(() => {
        if (modalDraggedEl) {
          modalDraggedEl.classList.add('opacity-30', 'bg-indigo-50/80', 'scale-[0.99]', 'border-indigo-400');
        }
      }, 0);
    };

    window.handleModalDragEnd = function(e) {
      hideDropLine();
      if (modalDraggedEl) {
        modalDraggedEl.classList.remove('opacity-30', 'bg-indigo-50/80', 'scale-[0.99]', 'border-indigo-400');
      }
      modalDraggedEl = null;
      modalInsertTargetEl = null;
    };

    // --- 버튼을 통한 순수 DOM 이동 ---
    window.moveTeacherOrderModalItem = function(tName, direction) {
      const container = document.getElementById('teacherOrderListContainer');
      if (!container) return;

      const el = container.querySelector(`.teacher-order-card[data-teacher="${CSS.escape(tName)}"]`);
      if (!el) return;

      if (direction === 'top') {
        const first = container.querySelector('.teacher-order-card');
        if (first && first !== el) container.insertBefore(el, first);
      } else if (direction === 'up') {
        let prev = el.previousElementSibling;
        while (prev && !prev.classList.contains('teacher-order-card')) {
          prev = prev.previousElementSibling;
        }
        if (prev) container.insertBefore(el, prev);
      } else if (direction === 'down') {
        let next = el.nextElementSibling;
        while (next && !next.classList.contains('teacher-order-card')) {
          next = next.nextElementSibling;
        }
        if (next) container.insertBefore(next, el);
      } else if (direction === 'bottom') {
        container.appendChild(el);
      }

      updateModalVisualIndexes();
    };

    // --- 빠른 프리셋 정렬 (DOM 노드 재배치) ---
    window.sortTeacherOrderModalList = function(sortType) {
      const container = document.getElementById('teacherOrderListContainer');
      if (!container) return;

      const cards = Array.from(container.querySelectorAll('.teacher-order-card'));
      if (cards.length === 0) return;

      cards.sort((a, b) => {
        const nameA = a.dataset.teacher || '';
        const nameB = b.dataset.teacher || '';
        const totA = parseFloat(a.dataset.total) || 0;
        const totB = parseFloat(b.dataset.total) || 0;

        if (sortType === 'hoursDesc') return (totB - totA) || nameA.localeCompare(nameB, 'ko');
        if (sortType === 'hoursAsc') return (totA - totB) || nameA.localeCompare(nameB, 'ko');
        if (sortType === 'nameAsc') return nameA.localeCompare(nameB, 'ko');
        return 0;
      });

      cards.forEach(card => container.appendChild(card));
      updateModalVisualIndexes();
    };

    // --- 교사명 실시간 필터 (CSS display 토글 방식) ---
    window.filterTeacherOrderModalList = function() {
      const container = document.getElementById('teacherOrderListContainer');
      if (!container) return;

      const searchVal = (document.getElementById('teacherOrderModalSearch')?.value || '').trim().toLowerCase();
      const cards = container.querySelectorAll('.teacher-order-card');

      cards.forEach(card => {
        const name = (card.dataset.teacher || '').toLowerCase();
        if (!searchVal || name.includes(searchVal)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });

      updateModalVisualIndexes();
    };

    // --- Main Table Drag Handlers ---
    window.handleTeacherRowDragStart = function(e, teacherName) {
      draggedTeacherName = teacherName;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', teacherName);
      const row = e.currentTarget;
      setTimeout(() => {
        row.classList.add('opacity-40', 'bg-indigo-50');
      }, 0);
    };

    window.handleTeacherRowDragOver = function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const row = e.currentTarget;
      const rect = row.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        row.classList.add('border-t-2', 'border-indigo-600');
        row.classList.remove('border-b-2');
      } else {
        row.classList.add('border-b-2', 'border-indigo-600');
        row.classList.remove('border-t-2');
      }
    };

    window.handleTeacherRowDragLeave = function(e) {
      const row = e.currentTarget;
      row.classList.remove('border-t-2', 'border-b-2', 'border-indigo-600');
    };

    window.handleTeacherRowDrop = function(e, targetTeacherName) {
      e.preventDefault();
      const row = e.currentTarget;
      row.classList.remove('border-t-2', 'border-b-2', 'border-indigo-600');

      if (!draggedTeacherName || draggedTeacherName === targetTeacherName) {
        return;
      }

      const rect = row.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const insertBefore = e.clientY < midY;

      let list = window.getCurrentTeacherSummaryList();
      const fromIdx = list.indexOf(draggedTeacherName);
      if (fromIdx === -1) return;

      list.splice(fromIdx, 1);
      const toIdx = list.indexOf(targetTeacherName);
      if (toIdx === -1) {
        list.push(draggedTeacherName);
      } else {
        list.splice(insertBefore ? toIdx : toIdx + 1, 0, draggedTeacherName);
      }

      setTeacherOrder(list);
      renderAllGradesTeacherSummary();
    };

    window.handleTeacherRowDragEnd = function(e) {
      draggedTeacherName = null;
      document.querySelectorAll('#allGradesTeacherSummaryTbody tr').forEach(tr => {
        tr.classList.remove('opacity-40', 'bg-indigo-50', 'border-t-2', 'border-b-2', 'border-indigo-600');
      });
    };

    window.resetTeacherOrderToDefault = function() {
      if (confirm('교사 정렬 순서를 기본값(연간 총 시수 내림차순)으로 되돌리시겠습니까?')) {
        setTeacherOrder([]);
        renderAllGradesTeacherSummary();
      }
    };

    // ==========================================
    // COURSE BADGE DRAG & DROP & CLICK NAVIGATION
    // ==========================================
    let draggedCourseData = null;
    window._isCourseBadgeDragging = false;

    window.scrollToCurriculumCourse = function(courseId) {
      if (!courseId) return;

      const curriculum = getAllGradesCurriculum();
      const item = curriculum.find(c => c.id === courseId);
      if (!item) {
        console.warn('과목을 편제표에서 찾을 수 없습니다:', courseId);
        return;
      }

      // Check and reset filters if they would hide this item
      const filterGrade = document.getElementById('allGradesFilterGrade');
      const filterSem = document.getElementById('allGradesFilterSemester');
      const filterCat = document.getElementById('allGradesFilterCategory');
      const filterStatus = document.getElementById('allGradesFilterStatus');
      const searchInput = document.getElementById('allGradesCourseSearchInput');

      let needRerender = false;
      if (filterGrade && filterGrade.value !== 'all' && filterGrade.value !== item.grade) {
        filterGrade.value = 'all';
        needRerender = true;
      }
      if (filterSem && filterSem.value !== 'all' && filterSem.value !== String(item.semester)) {
        filterSem.value = 'all';
        needRerender = true;
      }
      if (filterCat && filterCat.value !== 'all') {
        const isChoice = (item.category === '선택' || item.category === '학생선택');
        if ((filterCat.value === '지정' && isChoice) || (filterCat.value === '선택' && !isChoice)) {
          filterCat.value = 'all';
          needRerender = true;
        }
      }
      if (filterStatus && filterStatus.value !== 'all' && filterStatus.value !== item.status) {
        filterStatus.value = 'all';
        needRerender = true;
      }
      if (searchInput && searchInput.value) {
        searchInput.value = '';
        needRerender = true;
      }

      if (needRerender) {
        renderAllGradesCurriculumTable();
      }

      // Ensure DOM is ready, then scroll and highlight
      setTimeout(() => {
        const row = document.getElementById('curr_row_' + courseId);
        if (!row) return;

        // 1. Scroll window so the curriculum section is positioned near the top of the viewport
        const section = document.getElementById('allGradesCurriculumSection') || document.getElementById('allGradesCurriculumTableContainer');
        if (section) {
          const sectionRect = section.getBoundingClientRect();
          const targetY = window.pageYOffset + sectionRect.top - 80;
          window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        }

        // 2. Scroll inside the table container so that the row is right at the top
        const container = document.getElementById('allGradesCurriculumTableContainer');
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const rowRect = row.getBoundingClientRect();
          const relativeTop = rowRect.top - containerRect.top + container.scrollTop - 36;
          container.scrollTo({ top: Math.max(0, relativeTop), behavior: 'smooth' });
        }

        // 3. Highlight row with pulse animation and focus
        document.querySelectorAll('.curr-highlight-target').forEach(el => {
          el.classList.remove('curr-highlight-target', 'bg-amber-100/90', 'ring-2', 'ring-amber-500', 'ring-inset');
        });

        row.classList.add('curr-highlight-target', 'bg-amber-100/90', 'ring-2', 'ring-amber-500', 'ring-inset');

        const inputEl = row.querySelector('input[type="text"]');
        if (inputEl) {
          inputEl.focus();
        }

        setTimeout(() => {
          row.classList.remove('bg-amber-100/90', 'ring-2', 'ring-amber-500', 'ring-inset');
        }, 3000);
      }, 50);
    };

    window.handleCourseBadgeDragStart = function(e, itemId, semester, fromTeacher, subject, hours) {
      window._isCourseBadgeDragging = true;
      e.stopPropagation(); // 행 순서 드래그와 충돌 방지
      draggedCourseData = { itemId, semester, fromTeacher, subject, hours };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify(draggedCourseData));
      
      const badge = e.currentTarget;
      setTimeout(() => {
        if (badge) badge.classList.add('opacity-40', 'scale-95');
      }, 0);
    };

    window.handleCourseBadgeDragEnd = function(e) {
      setTimeout(() => { window._isCourseBadgeDragging = false; }, 200);
      const badge = e.currentTarget;
      if (badge) badge.classList.remove('opacity-40', 'scale-95');
      draggedCourseData = null;
      document.querySelectorAll('.course-drop-cell').forEach(cell => {
        cell.classList.remove('bg-blue-100/70', 'bg-emerald-100/70', 'ring-2', 'ring-indigo-500', 'ring-emerald-500', 'ring-inset');
      });
    };

    window.handleCourseDropCellDragOver = function(e, cellSemester, targetTeacher) {
      if (!draggedCourseData) return;
      if (draggedCourseData.semester !== cellSemester) return; // 다른 학기 칸은 드롭 불가
      if (draggedCourseData.fromTeacher === targetTeacher) return; // 동일 교사는 무시

      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';

      const cell = e.currentTarget;
      if (cellSemester === 1) {
        cell.classList.add('bg-blue-100/70', 'ring-2', 'ring-indigo-500', 'ring-inset');
      } else {
        cell.classList.add('bg-emerald-100/70', 'ring-2', 'ring-emerald-500', 'ring-inset');
      }
    };

    window.handleCourseDropCellDragLeave = function(e) {
      const cell = e.currentTarget;
      if (cell && e.relatedTarget && cell.contains(e.relatedTarget)) return;
      cell.classList.remove('bg-blue-100/70', 'bg-emerald-100/70', 'ring-2', 'ring-indigo-500', 'ring-emerald-500', 'ring-inset');
    };

    window.handleCourseDropCellDrop = function(e, cellSemester, targetTeacher) {
      e.preventDefault();
      e.stopPropagation();
      const cell = e.currentTarget;
      cell.classList.remove('bg-blue-100/70', 'bg-emerald-100/70', 'ring-2', 'ring-indigo-500', 'ring-emerald-500', 'ring-inset');

      if (!draggedCourseData) return;
      if (draggedCourseData.semester !== cellSemester) {
        alert('⚠️ 학기가 다른 칸으로는 과목을 이동할 수 없습니다.');
        return;
      }
      if (draggedCourseData.fromTeacher === targetTeacher) return;

      const curriculum = getAllGradesCurriculum();
      const item = curriculum.find(c => c.id === draggedCourseData.itemId);
      if (!item) return;

      const fromT = draggedCourseData.fromTeacher;
      const subj = draggedCourseData.subject;
      const hours = draggedCourseData.hours;

      // 담당 교사 변경 및 상태 반영
      item.teacher = targetTeacher;
      item.isModified = (targetTeacher !== (item.originalTeacher || ''));
      if (item.status === '폐강') item.status = '개설';

      setAllGradesCurriculum(curriculum);
      renderAllGradesDashboard();

      console.log(`✅ [${cellSemester}학기 ${subj}(${hours}h)] 담당 교사 변경: [${fromT}] ➔ [${targetTeacher}]`);
      draggedCourseData = null;
    };

    function renderAllGradesTeacherSummary() {
      const tbody = document.getElementById('allGradesTeacherSummaryTbody');
      if (!tbody) return;

      const curriculum = getAllGradesCurriculum();
      const searchVal = (document.getElementById('allGradesTeacherSearchInput')?.value || '').trim().toLowerCase();

      // Aggregate by teacher
      const teacherMap = {};
      curriculum.forEach(item => {
        if (item.status === '폐강') return;
        const t = (item.teacher || '').trim();
        if (!t || t === '폐강') return;

        if (!teacherMap[t]) {
          teacherMap[t] = {
            sem1Courses: [],
            sem1Hours: 0,
            sem2Courses: [],
            sem2Hours: 0
          };
        }

        const tag = {
          id: item.id,
          grade: item.grade,
          subject: item.subject,
          division: item.division || '',
          hours: item.hours,
          semester: item.semester,
          category: item.category,
          isModified: item.isModified
        };

        if (item.semester === 1) {
          teacherMap[t].sem1Courses.push(tag);
          teacherMap[t].sem1Hours += item.hours;
        } else {
          teacherMap[t].sem2Courses.push(tag);
          teacherMap[t].sem2Hours += item.hours;
        }
      });

      const customOrder = getTeacherOrder();
      let teachersList = Object.keys(teacherMap);
      teachersList.sort((a, b) => {
        const idxA = customOrder.indexOf(a);
        const idxB = customOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b, 'ko');
      });

      if (searchVal) {
        teachersList = teachersList.filter(t => t.toLowerCase().includes(searchVal));
      }

      if (teachersList.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="p-8 text-center text-slate-400 italic bg-white">
              ${curriculum.length === 0 
                ? '기초데이터 엑셀 파일을 업로드하거나 예시데이터를 불러오면 교사별 시수 통계가 표시됩니다.' 
                : '검색 조건과 일치하는 교사가 없습니다.'}
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = teachersList.map((tName, idx) => {
        const d = teacherMap[tName];
        const totalHours = d.sem1Hours + d.sem2Hours;
        const avgHours = (totalHours / 2).toFixed(1);
        const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50';

        const s1Tags = d.sem1Courses.map(c => {
          let divBadge = '';
          const cleanDiv = String(c.division || '').trim();
          if (cleanDiv && cleanDiv !== '선택') {
            let badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            if (cleanDiv.includes('분반')) {
              badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
            } else if (cleanDiv === '2반') {
              badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-200';
            }
            divBadge = `<span class="text-[10px] px-1 py-0.2 rounded font-bold border pointer-events-none ${badgeClass}">${escapeHtml(cleanDiv)}</span>`;
          }

          const gradeLabel = String(c.grade || '').replace('학년', '');
          return `
          <span class="course-drag-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
            (c.category === '지정' || c.category === '학교지정')
              ? 'bg-slate-100 text-slate-700 border border-slate-300' 
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          } cursor-pointer active:cursor-grabbing hover:ring-2 hover:ring-indigo-400 hover:shadow-xs transition select-none"
          draggable="true"
          data-course-id="${escapeHtml(c.id)}"
          data-semester="1"
          data-from-teacher="${escapeHtml(tName)}"
          data-subject="${escapeHtml(c.subject)}"
          data-hours="${c.hours}"
          onclick="if(!window._isCourseBadgeDragging) window.scrollToCurriculumCourse('${escapeHtml(c.id)}')"
          ondragstart="window.handleCourseBadgeDragStart(event, '${escapeHtml(c.id)}', 1, '${escapeHtml(tName)}', '${escapeHtml(c.subject)}', ${c.hours})"
          ondragend="window.handleCourseBadgeDragEnd(event)"
          title="클릭: 아래 상세 테이블에서 과목 위치로 이동 | 드래그: 다른 교사에게 과목 넘겨주기 (${c.category}${cleanDiv ? ' ' + cleanDiv : ''})">
            <span class="text-[9px] text-slate-500 font-semibold pointer-events-none">${gradeLabel}학년</span>
            ${divBadge}
            <span class="pointer-events-none">${escapeHtml(c.subject)}</span>
            <span class="font-black text-indigo-700 pointer-events-none">(${c.hours})</span>
          </span>
        `;
        }).join(' ');

        const s2Tags = d.sem2Courses.map(c => {
          let divBadge = '';
          const cleanDiv = String(c.division || '').trim();
          if (cleanDiv && cleanDiv !== '선택') {
            let badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
            if (cleanDiv.includes('분반')) {
              badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
            } else if (cleanDiv === '2반') {
              badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-200';
            }
            divBadge = `<span class="text-[10px] px-1 py-0.2 rounded font-bold border pointer-events-none ${badgeClass}">${escapeHtml(cleanDiv)}</span>`;
          }

          const gradeLabel = String(c.grade || '').replace('학년', '');
          return `
          <span class="course-drag-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
            (c.category === '지정' || c.category === '학교지정')
              ? 'bg-slate-100 text-slate-700 border border-slate-300' 
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          } cursor-pointer active:cursor-grabbing hover:ring-2 hover:ring-emerald-400 hover:shadow-xs transition select-none"
          draggable="true"
          data-course-id="${escapeHtml(c.id)}"
          data-semester="2"
          data-from-teacher="${escapeHtml(tName)}"
          data-subject="${escapeHtml(c.subject)}"
          data-hours="${c.hours}"
          onclick="if(!window._isCourseBadgeDragging) window.scrollToCurriculumCourse('${escapeHtml(c.id)}')"
          ondragstart="window.handleCourseBadgeDragStart(event, '${escapeHtml(c.id)}', 2, '${escapeHtml(tName)}', '${escapeHtml(c.subject)}', ${c.hours})"
          ondragend="window.handleCourseBadgeDragEnd(event)"
          title="클릭: 아래 상세 테이블에서 과목 위치로 이동 | 드래그: 다른 교사에게 과목 넘겨주기 (${c.category}${cleanDiv ? ' ' + cleanDiv : ''})">
            <span class="text-[9px] text-slate-500 font-semibold pointer-events-none">${gradeLabel}학년</span>
            ${divBadge}
            <span class="pointer-events-none">${escapeHtml(c.subject)}</span>
            <span class="font-black text-emerald-700 pointer-events-none">(${c.hours})</span>
          </span>
        `;
        }).join(' ');

        return `
          <tr class="${rowBg} hover:bg-indigo-50/50 transition-colors select-none group"
              data-teacher="${escapeHtml(tName)}">
            <td class="p-2.5 text-center font-medium text-slate-500 border-r border-slate-200">
              <div class="flex items-center justify-center gap-1">
                <button type="button" onclick="window.openTeacherOrderModal()" class="cursor-pointer text-slate-400 hover:text-indigo-600 text-sm font-bold transition-colors select-none" title="교사 순서 정렬 창 열기">⠿</button>
                <span class="font-semibold text-xs">${idx + 1}</span>
              </div>
            </td>
            <td class="p-2.5 text-center font-black text-slate-900 border-r border-slate-200">${escapeHtml(tName)}</td>
            <td class="p-2.5 border-r border-slate-200 course-drop-cell transition-all"
                data-teacher="${escapeHtml(tName)}"
                data-semester="1"
                ondragover="window.handleCourseDropCellDragOver(event, 1, '${escapeHtml(tName)}')"
                ondragleave="window.handleCourseDropCellDragLeave(event)"
                ondrop="window.handleCourseDropCellDrop(event, 1, '${escapeHtml(tName)}')">
              <div class="flex flex-wrap gap-1 min-h-[26px] items-center">${s1Tags || '<span class="text-slate-300 italic text-[11px] p-0.5 rounded border border-dashed border-slate-200 pointer-events-none">과목 드롭 가능</span>'}</div>
            </td>
            <td class="p-2.5 text-center font-black text-blue-700 border-r border-slate-200 bg-blue-50/40">${d.sem1Hours}</td>
            <td class="p-2.5 border-r border-slate-200 course-drop-cell transition-all"
                data-teacher="${escapeHtml(tName)}"
                data-semester="2"
                ondragover="window.handleCourseDropCellDragOver(event, 2, '${escapeHtml(tName)}')"
                ondragleave="window.handleCourseDropCellDragLeave(event)"
                ondrop="window.handleCourseDropCellDrop(event, 2, '${escapeHtml(tName)}')">
              <div class="flex flex-wrap gap-1 min-h-[26px] items-center">${s2Tags || '<span class="text-slate-300 italic text-[11px] p-0.5 rounded border border-dashed border-slate-200 pointer-events-none">과목 드롭 가능</span>'}</div>
            </td>
            <td class="p-2.5 text-center font-black text-emerald-700 border-r border-slate-200 bg-emerald-50/40">${d.sem2Hours}</td>
            <td class="p-2.5 text-center font-black text-slate-900 border-r border-slate-200 bg-slate-100/50">${totalHours}</td>
            <td class="p-2.5 text-center font-extrabold text-indigo-700 bg-slate-100/50">${avgHours}</td>
          </tr>
        `;
      }).join('');
    }

    function renderAllGradesCurriculumTable() {
      const tbody = document.getElementById('allGradesCurriculumTableBody');
      if (!tbody) return;

      const sData = (typeof getStep3Data === 'function') ? getStep3Data() : { categories: [] };
      const mainSummaryBadge = document.getElementById('allGradesCategorySummaryBadge');
      if (mainSummaryBadge) {
        mainSummaryBadge.textContent = `${(sData.categories || []).length}개 군`;
      }

      const curriculum = getAllGradesCurriculum();
      const filterGrade = document.getElementById('allGradesFilterGrade')?.value || 'all';
      const filterSem = document.getElementById('allGradesFilterSemester')?.value || 'all';
      const filterCat = document.getElementById('allGradesFilterCategory')?.value || 'all';
      const filterStatus = document.getElementById('allGradesFilterStatus')?.value || 'all';
      const filterTeacherAssigned = document.getElementById('allGradesFilterTeacherAssigned')?.value || (window._isUnassignedTeacherFilterActive ? 'unassigned' : 'all');
      const searchVal = (document.getElementById('allGradesCourseSearchInput')?.value || '').trim().toLowerCase();

      let filtered = curriculum.filter(item => {
        if (filterGrade !== 'all' && item.grade !== filterGrade) return false;
        if (filterSem !== 'all' && String(item.semester) !== filterSem) return false;
        if (filterCat !== 'all') {
          const matchCat = (filterCat === '지정' && (item.category === '지정' || item.category === '학교지정')) ||
                           (filterCat === '선택' && (item.category === '선택' || item.category === '학생선택')) ||
                           item.category === filterCat;
          if (!matchCat) return false;
        }
        if (filterStatus !== 'all' && item.status !== filterStatus) return false;

        // 담당 교사 배정 필터
        if (filterTeacherAssigned === 'unassigned') {
          const isUnassigned = (item.status !== '폐강') && (!item.teacher || !item.teacher.trim() || item.teacher.trim() === '미지정' || item.teacher.trim() === '미배정' || item.teacher.trim() === '-' || item.teacher.trim() === '없음');
          if (!isUnassigned) return false;
        } else if (filterTeacherAssigned === 'assigned') {
          const isAssigned = (item.status !== '폐강') && item.teacher && item.teacher.trim() && item.teacher.trim() !== '미지정' && item.teacher.trim() !== '미배정' && item.teacher.trim() !== '-' && item.teacher.trim() !== '없음';
          if (!isAssigned) return false;
        }

        if (searchVal) {
          const cleanSearch = searchVal.replace(/\s+/g, '');
          const cleanSubj = (item.subject || '').toLowerCase().replace(/\s+/g, '');
          const cleanTeacher = (item.teacher || '').toLowerCase().replace(/\s+/g, '');
          if (!cleanSubj.includes(cleanSearch) && !cleanTeacher.includes(cleanSearch)) return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="11" class="p-8 text-center text-slate-400 italic bg-white">
              <p class="mb-3">
                ${window._isUnassignedTeacherFilterActive 
                  ? '🎉 축하합니다! 담당 교사가 지정되지 않은 과목이 없습니다. 모든 개설 과목에 교사가 배정되었습니다.' 
                  : (curriculum.length === 0 
                      ? '기초데이터 엑셀 파일을 업로드하거나 예시데이터를 불러오면 1·2·3학년 전과목 배정 상세가 표시됩니다.' 
                      : '선택하신 필터 조건과 일치하는 과목이 없습니다.')}
              </p>
              ${window._isUnassignedTeacherFilterActive 
                ? '<button type="button" onclick="window.toggleUnassignedTeachersFilter()" class="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"><span>전체 과목 보기</span></button>' 
                : '<button type="button" onclick="window.openAddCourseModal()" class="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"><span>➕</span><span>새 과목 직접 추가하기</span></button>'}
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map((c, idx) => {
        const isClosed = c.status === '폐강';
        const isModified = Boolean(c.isModified);
        const rowBg = isClosed 
          ? 'bg-rose-50/50 text-slate-400' 
          : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50');

        const isChoice = (c.category === '선택' || c.category === '학생선택');
        const catBadge = isChoice 
          ? `<button type="button" onclick="window.toggleCurriculumItemCategory('${c.id}')" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition cursor-pointer" title="클릭하여 [지정]으로 전환">선택 ⇄</button>` 
          : `<button type="button" onclick="window.toggleCurriculumItemCategory('${c.id}')" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition cursor-pointer" title="클릭하여 [선택]으로 전환">지정 ⇄</button>`;

        let cleanDiv = (c.division || '').trim();
        let divLabel = cleanDiv;
        if (cleanDiv && !cleanDiv.endsWith('반') && !cleanDiv.startsWith('분반') && cleanDiv !== '선택') {
          divLabel = cleanDiv + '반';
        }
        const divisionTag = (cleanDiv && cleanDiv !== '선택') 
          ? `<span class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-black rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 whitespace-nowrap select-none shadow-2xs" title="반 구분: ${escapeHtml(divLabel)}">${escapeHtml(divLabel)}</span>`
          : '';

        const statusBadge = isClosed 
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-200 text-rose-900 border border-rose-300 animate-pulse">🚫 폐강</span>' 
          : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">✅ 개설</span>';

        const isUnassigned = (!isClosed) && (!c.teacher || !c.teacher.trim() || c.teacher.trim() === '미지정' || c.teacher.trim() === '미배정' || c.teacher.trim() === '-' || c.teacher.trim() === '없음');
        let teacherInputStyle = 'w-full px-2 py-1 text-xs rounded-lg border focus:ring-2 focus:ring-indigo-500 outline-none transition';
        if (isModified) {
          teacherInputStyle += ' bg-blue-50/90 text-blue-950 font-black border-blue-400 ring-1 ring-blue-300 shadow-2xs';
        } else if (isClosed) {
          teacherInputStyle += ' bg-rose-50 text-rose-700 font-bold border-rose-200';
        } else if (isUnassigned) {
          teacherInputStyle += ' bg-amber-50/90 text-amber-950 font-black border-amber-400 ring-1 ring-amber-300 placeholder:text-amber-500 shadow-2xs';
        } else {
          teacherInputStyle += ' bg-white text-slate-800 border-slate-300';
        }

        const modifiedIndicator = isModified 
          ? `<span class="px-1.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded font-black text-[10px] inline-flex items-center gap-0.5 shadow-2xs" title="엑셀 원본 교사: ${escapeHtml(c.originalTeacher)}">
               <span>✓수정됨</span>
             </span>` 
          : '<span class="text-slate-300 text-[10px]">원본</span>';

        const resetBtn = isModified 
          ? `<button type="button" onclick="window.resetCurriculumItemTeacher('${c.id}')" class="px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-100 rounded border border-slate-200 transition" title="엑셀 원본 교사(${escapeHtml(c.originalTeacher)})로 복원">↺ 복원</button>` 
          : '';

        const toggleBtn = isClosed 
          ? `<button type="button" onclick="window.toggleCurriculumItemStatus('${c.id}')" class="px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 transition" title="개설 상태로 전환">개설 전환</button>` 
          : `<button type="button" onclick="window.toggleCurriculumItemStatus('${c.id}')" class="px-2 py-0.5 text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded border border-rose-300 transition" title="폐강 상태로 전환">폐강 전환</button>`;

        const deleteBtn = `<button type="button" onclick="window.deleteCurriculumItem('${c.id}')" class="px-1.5 py-0.5 text-[10px] font-bold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 rounded border border-rose-200 transition cursor-pointer" title="이 과목을 편제표에서 완전히 삭제">🗑️ 삭제</button>`;

        const divValue = (c.division || (c.category === '선택' ? '선택' : '1반')).trim();
        let divBadgeStyle = 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100';
        if (divValue === '1반' || divValue === '1') {
          divBadgeStyle = 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100 font-black';
        } else if (divValue === '2반' || divValue === '2') {
          divBadgeStyle = 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100 font-black';
        } else if (divValue.includes('분반')) {
          divBadgeStyle = 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100 font-black';
        }

        return `
          <tr id="curr_row_${c.id}" data-curr-id="${c.id}" class="${rowBg} hover:bg-indigo-50/40 transition-colors">
            <td class="p-2 text-center font-medium text-slate-500 border-r border-slate-200">${idx + 1}</td>
            <td class="p-2 text-center font-bold text-slate-800 border-r border-slate-200">${c.grade}</td>
            <td class="p-2 text-center font-medium text-slate-700 border-r border-slate-200">${c.semester}학기</td>
            <td class="p-2 text-center border-r border-slate-200">${catBadge}</td>
            <td class="p-1.5 text-center border-r border-slate-200">
              <button type="button" 
                      onclick="window.cycleCurriculumDivision('${c.id}')" 
                      class="px-2.5 py-0.5 rounded-full text-xs font-bold border transition cursor-pointer select-none shadow-3xs ${divBadgeStyle}" 
                      title="클릭하여 반 구분 순환 변경 (선택 ➔ 1반 ➔ 2반 ➔ ... ➔ 분반)">
                ${escapeHtml(divValue)}
              </button>
            </td>
            <td class="p-1.5 border-r border-slate-200">
              <div class="flex items-center gap-1.5 min-w-[190px]">
                <input type="text" 
                       value="${escapeHtml(c.subject)}" 
                       onchange="window.updateCurriculumItemSubject('${c.id}', this.value)" 
                       class="w-36 sm:w-40 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none transition shrink-0 ${isClosed ? 'line-through text-slate-400 bg-rose-50/40' : 'text-slate-900'}" 
                       placeholder="과목명 입력" 
                       title="클릭하여 과목명 직접 수정 (별표 제거, 오타 수정 등)" />
                ${divisionTag}
              </div>
            </td>
            <td class="p-1.5 text-center border-r border-slate-200">
              <input type="number" 
                     min="0" 
                     max="40" 
                     step="0.5" 
                     value="${c.hours}" 
                     onchange="window.updateCurriculumItemHours('${c.id}', this.value)" 
                     class="w-16 px-1.5 py-1 text-center text-xs font-black rounded-lg border border-slate-300 bg-white hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-none text-indigo-700 transition" 
                     placeholder="시수" 
                     title="클릭하여 주당 총 시수 직접 수정" />
            </td>
            <td class="p-1.5 text-center border-r border-slate-200">
              ${(() => {
                const catId = (typeof getSubjectCategory === 'function') ? getSubjectCategory(c.subject, c.grade) : null;
                const sData = (typeof getStep3Data === 'function') ? getStep3Data() : { categories: [] };
                const cat = catId ? (sData.categories || []).find(x => x.id === catId) : null;
                const col = cat ? (STEP3_COLOR_SCHEMES[cat.color] || STEP3_COLOR_SCHEMES.blue) : null;
                const bStyle = cat ? (col ? col.badge : 'bg-slate-100 text-slate-800') : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200';
                return `<button type="button" 
                                onclick="window.openSubjectCategoryManagerModal('${escapeHtml(c.subject)}', '${escapeHtml(c.grade)}')" 
                                class="px-2 py-0.5 rounded-full text-[10px] font-extrabold border transition cursor-pointer select-none shadow-3xs ${bStyle}" 
                                title="클릭하여 교과군 설정 열기 (해당 과목 위치로 자동 스크롤)">
                          ${cat ? cat.name : '미지정'}
                        </button>`;
              })()}
            </td>
            <td class="p-2 text-center border-r border-slate-200">${statusBadge}</td>
            <td class="p-1.5 border-r border-slate-200">
              <div class="relative flex items-center">
                <input type="text" 
                       value="${escapeHtml(c.teacher)}" 
                       onchange="window.updateTeacherAssignment('${c.id}', this.value)" 
                       class="${teacherInputStyle}" 
                       placeholder="${isUnassigned ? '⚠️ 교사명 입력 (미지정)' : '교사명 입력'}"
                       title="클릭하여 교사명 변경 (엑셀 원본: ${escapeHtml(c.originalTeacher)})" />
                ${isUnassigned ? '<span class="absolute right-2 text-[10px] text-amber-700 font-black pointer-events-none select-none bg-amber-200/90 px-1 py-0.2 rounded border border-amber-400/80">미지정</span>' : ''}
              </div>
            </td>
            <td class="p-2 text-center border-r border-slate-200">${modifiedIndicator}</td>
            <td class="p-1.5 text-center">
              <div class="flex items-center justify-center gap-1">
                ${resetBtn}
                ${toggleBtn}
                ${deleteBtn}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    function initAllGradesListeners() {
      const fileInput = document.getElementById('allGradesFileInput');
      const uploadBtn = document.getElementById('btnUploadAllGradesExcel');
      const applyBtn = document.getElementById('btnApplyStep2ToAllGrades');
      const templateBtn = document.getElementById('btnDownloadCurriculumTemplate');
      const sampleBtn = document.getElementById('btnSampleCurriculumData');
      const exportCurrentBtn = document.getElementById('btnExportCurrentCurriculum');
      const exportBtn = document.getElementById('btnExportAllGradesExcel');
      const allGradesDropZone = document.getElementById('allGradesDropZone');
      const allGradesDropFileInput = document.getElementById('allGradesDropFileInput');

      uploadBtn?.addEventListener('click', () => fileInput?.click());
      fileInput?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          parseAllGradesExcel(e.target.files[0]);
          e.target.value = '';
        }
      });

      if (allGradesDropFileInput) {
        allGradesDropFileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            parseAllGradesExcel(e.target.files[0]);
            e.target.value = '';
          }
        });
      }

      // Drag & Drop on All Grades Drop Zone
      if (allGradesDropZone) {
        ['dragenter', 'dragover'].forEach(name => {
          allGradesDropZone.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            allGradesDropZone.classList.add('border-indigo-600', 'bg-indigo-100/70', 'ring-4', 'ring-indigo-200');
          });
        });
        ['dragleave', 'drop'].forEach(name => {
          allGradesDropZone.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            allGradesDropZone.classList.remove('border-indigo-600', 'bg-indigo-100/70', 'ring-4', 'ring-indigo-200');
          });
        });
        allGradesDropZone.addEventListener('drop', (e) => {
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            parseAllGradesExcel(e.dataTransfer.files[0]);
          }
        });
      }

      // Drag & Drop on Upload Button
      if (uploadBtn) {
        ['dragenter', 'dragover'].forEach(name => {
          uploadBtn.addEventListener(name, (e) => {
            e.preventDefault();
            uploadBtn.classList.add('ring-2', 'ring-indigo-400', 'scale-105');
          });
        });
        ['dragleave', 'drop'].forEach(name => {
          uploadBtn.addEventListener(name, (e) => {
            e.preventDefault();
            uploadBtn.classList.remove('ring-2', 'ring-indigo-400', 'scale-105');
          });
        });
        uploadBtn.addEventListener('drop', (e) => {
          e.preventDefault();
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            parseAllGradesExcel(e.dataTransfer.files[0]);
          }
        });
      }

      // Drag & Drop on Publisher Upload Button
      const pubDropLabel = document.getElementById('lblUploadPublisherExcel');
      if (pubDropLabel) {
        ['dragenter', 'dragover'].forEach(name => {
          pubDropLabel.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            pubDropLabel.parentElement?.classList.add('ring-2', 'ring-purple-600', 'bg-purple-100', 'scale-105');
          });
        });
        ['dragleave', 'drop'].forEach(name => {
          pubDropLabel.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            pubDropLabel.parentElement?.classList.remove('ring-2', 'ring-purple-600', 'bg-purple-100', 'scale-105');
          });
        });
        pubDropLabel.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            parsePublisherExcel(e.dataTransfer.files[0]);
          }
        });
      }

      // Drag & Drop on Header '작업 불러오기' Button
      const headerRestoreLabel = document.getElementById('headerRestoreBackupLabel');
      if (headerRestoreLabel) {
        ['dragenter', 'dragover'].forEach(name => {
          headerRestoreLabel.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            headerRestoreLabel.classList.add('ring-2', 'ring-indigo-600', 'bg-indigo-100', 'scale-105');
          });
        });
        ['dragleave', 'drop'].forEach(name => {
          headerRestoreLabel.addEventListener(name, (e) => {
            e.preventDefault();
            e.stopPropagation();
            headerRestoreLabel.classList.remove('ring-2', 'ring-indigo-600', 'bg-indigo-100', 'scale-105');
          });
        });
        headerRestoreLabel.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const f = e.dataTransfer.files[0];
            if (f.name.toLowerCase().endsWith('.json')) {
              window.importBackupJsonFile(f);
            } else {
              processUploadedFile(f);
            }
          }
        });
      }

      exportCurrentBtn?.addEventListener('click', () => {
        if (typeof window.exportCurrentCurriculumExcel === 'function') {
          window.exportCurrentCurriculumExcel();
        }
      });
      templateBtn?.addEventListener('click', () => downloadCurriculumTemplate(false));
      exportBtn?.addEventListener('click', exportAllGradesConsolidatedExcel);
      document.getElementById('btnExportSubjectBasedExcel')?.addEventListener('click', exportSubjectBasedExcel);
      document.getElementById('publisherFileInput')?.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
          parsePublisherExcel(e.target.files[0]);
          e.target.value = '';
        }
      });

      document.getElementById('allGradesTeacherSearchInput')?.addEventListener('input', renderAllGradesTeacherSummary);
      document.getElementById('allGradesFilterGrade')?.addEventListener('change', renderAllGradesCurriculumTable);
      document.getElementById('allGradesFilterSemester')?.addEventListener('change', renderAllGradesCurriculumTable);
      document.getElementById('allGradesFilterCategory')?.addEventListener('change', renderAllGradesCurriculumTable);
      document.getElementById('allGradesFilterStatus')?.addEventListener('change', renderAllGradesCurriculumTable);
      document.getElementById('allGradesFilterTeacherAssigned')?.addEventListener('change', (e) => {
        window._isUnassignedTeacherFilterActive = (e.target.value === 'unassigned');
        renderAllGradesCurriculumTable();
        window.updateUnassignedTeacherBadgeState();
      });
      document.getElementById('allGradesCourseSearchInput')?.addEventListener('input', renderAllGradesCurriculumTable);
    }

    // Initialize MultiState & Load on Startup (항상 완전한 빈 화면으로 시작 - 웹상 데이터 0%)
    function loadAllState() {
      initAllGradesListeners();

      // 브라우저 로컬 저장소에 남아있을 수 있는 이전 캐시 완전 소거 (웹상에 데이터 보존 금지)
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('SANGJI_COURSE_REG_MULTI_V5');
        localStorage.removeItem(FIREBASE_CONFIG_KEY);
      } catch (e) {}

      // 저장된 폴더 핸들(저장 위치) 비동기 로드
      getSavedDirHandle().then(handle => {
        if (handle) {
          rememberedDirHandle = handle;
          updateSaveButtonTooltip(handle.name);
        }
      });

      // 항상 완전히 깨끗한 초기 빈 상태로 시작 (사용자가 JSON 또는 엑셀 파일을 불러와야만 데이터 표시)
      MultiState.academicYearsList = ['2027학년도'];
      MultiState.activeAcademicYear = '2027학년도';
      MultiState.datesByAcademicYear = { '2027학년도': ['2027.10.11.'] };
      MultiState.curriculumByAcademicYear = { '2027학년도': [] };
      MultiState.publishersByAcademicYear = { '2027학년도': {} };
      MultiState.publisherSubjectNamesByAcademicYear = { '2027학년도': {} };
      MultiState.customTeacherOrder = [];
      MultiState.yearsList = ['2027.10.11.'];
      MultiState.activeYear = '2027.10.11.';
      MultiState.activeGrade = '2학년';
      MultiState.activeStep = 1;
      MultiState.data = {
        '2027학년도': {
          '2027.10.11.': {
            '2학년': createEmptyGradeState('2학년'),
            '3학년': createEmptyGradeState('3학년'),
            '전체': { curriculum: [], lastUpdated: null }
          }
        }
      };

      Object.assign(AppState, createEmptyGradeState('2학년'));

      const uploadSection = document.getElementById('uploadSection');
      const appBody = document.getElementById('appBody');
      const allGradesSection = document.getElementById('allGradesSection');
      const btnResetAll = document.getElementById('btnResetAll');

      if (uploadSection) uploadSection.classList.remove('hidden');
      if (appBody) appBody.classList.add('hidden');
      if (allGradesSection) allGradesSection.classList.add('hidden');
      if (btnResetAll) btnResetAll.classList.add('hidden');

      switchAcademicContext('2027.10.11.', '2학년', false);
      renderYearGradeNav();
      updateModalStats();
      cloudSync.init();
    }

    // Run Startup Initialization
    
    // GitHub 최신 커밋 일시(업데이트 날짜 및 시간)와 자동 동기화
    async function syncGitHubLastCommitDate() {
      try {
        const repo = 'dydrb87-eng/Curriculum';
        const cacheKey = 'gh_last_commit_date';
        const cacheTimeKey = 'gh_last_commit_fetch_time';
        const now = Date.now();

        // 3분 캐시 확인 (불필요한 중복 호출 방지 및 API 레이트 리밋 대비)
        const cachedDate = sessionStorage.getItem(cacheKey);
        const lastFetch = parseInt(sessionStorage.getItem(cacheTimeKey) || '0', 10);
        if (cachedDate && (now - lastFetch < 3 * 60 * 1000)) {
          applyVersionDate(cachedDate);
          return;
        }

        const res = await fetch('https://api.github.com/repos/' + repo + '/commits?per_page=1', {
          headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].commit) {
          const commitDateStr = data[0].commit.committer?.date || data[0].commit.author?.date;
          if (commitDateStr) {
            const d = new Date(commitDateStr);
            // 한국 시간 (KST, UTC+9) 포맷: YYYY.MM.DD_HH:mm
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            const formatted = y + '.' + m + '.' + day + '_' + hh + ':' + mm;

            sessionStorage.setItem(cacheKey, formatted);
            sessionStorage.setItem(cacheTimeKey, String(now));
            applyVersionDate(formatted);
          }
        }
      } catch (err) {
        console.warn('GitHub commit date sync skipped:', err.message);
      }
    }

    function applyVersionDate(formatted) {
      const versionEl = document.getElementById('appVersionDateText');
      if (versionEl) {
        versionEl.textContent = '(' + formatted + ')';
      }
      if (document.title) {
        document.title = document.title.replace(/\(\d{4}\.\d{2}\.\d{2}_\d{2}:\d{2}\)/, '(' + formatted + ')');
      }
    }

    loadAllState();
    syncGitHubLastCommitDate();