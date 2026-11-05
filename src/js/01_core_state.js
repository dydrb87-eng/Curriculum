    // SECURITY & CODE PROTECTION (우클릭 및 소스보기/F12 차단)
    // ==========================================
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });
    document.addEventListener('keydown', function(e) {
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    // Global Application State
    const AppState = {
      detectedGrade: '2학년',
      fileName: '',
      students: [], // Array of { id, classNum, studentNum, name, career, sem1: [], sem2: [] }
      sem1Subjects: [], // Unique subjects
      sem2Subjects: [],
      currentSemester: 1, // 1 or 2
      step1Threshold: 3, // Threshold for medium gray shading
      
      // Step 2 Grouping Configurations
      sem1GroupCount: 5,
      sem2GroupCount: 7,
      splitSubjects: { 1: {}, 2: {} }, // { '물리학Ⅰ': 2 }
      pinnedSubjects: { 1: {}, 2: {} }, // { '국어독서': 1 }
      lockedGroups: { 1: {}, 2: {} }, // { 0: true } - 그룹 잠금 (해당 그룹 내 과목 고정 및 다른 과목 유입 차단)
      togetherPairs: { 1: [], 2: [] }, // Array of [subj1, subj2] pairs (동일 그룹 배치)
      separatePairs: { 1: [], 2: [] }, // Array of [subj1, subj2] pairs (다른 그룹 분리)
      closedSubjects: { 1: [], 2: [] }, // Array of confirmed closed subject names (폐강 확정)
      subjectMemos: { 1: {}, 2: {} }, // { 1: { '일본어': '소인수 선택 유지 요청' } }
      studentPins: [], // Array of { studentId, subject, group } (kept for compatibility)
      
      // Current Grouping Results
      currentPlan: {
        semester: 1,
        groups: [], // Array of Array of subject strings
        conflicts: [], // Array of conflict details
        timestamp: null
      },
      currentPlans: {
        1: null,
        2: null
      },
      crossSemesterRules: [], // Array of { id, sem1Subject, sem1Type, sem2Subject, sem2Type }
      step2Memos: { 1: '', 2: '' }, // { 1: '1학기 메모', 2: '2학기 메모' } (기준 날짜·학년·학기별 독립 메모)

      // Prior Enrollment Data (학생 명부 및 기이수 과목)
      priorData: null,
      crossCheckResult: {
        missingStudents: [],
        duplicateEnrollments: []
      },

      // Saved candidate proposals
      savedPlans: [], // Array of saved plan objects

      // Target Conflict N (null: optimal / number: exact N) & Historical Best Tracker
      targetConflictN: {
        1: null,
        2: null
      },
      simulationHistory: {
        1: { runCount: 0, minConflictEver: null, minConflictPlan: null },
        2: { runCount: 0, minConflictEver: null, minConflictPlan: null }
      }
    };

    // ==========================================