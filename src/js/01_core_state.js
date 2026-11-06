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

    // Helper: 빈 학년 상태 객체 생성
    function createEmptyGradeState(grade = '2학년') {
      const is3rd = (grade === '3학년');
      return {
        detectedGrade: grade,
        fileName: '',
        students: [],
        sem1Subjects: [],
        sem2Subjects: [],
        currentSemester: 1,
        step1Threshold: 3,
        sem1GroupCount: is3rd ? 5 : 3,
        sem2GroupCount: is3rd ? 7 : 4,
        splitSubjects: { 1: {}, 2: {} },
        pinnedSubjects: { 1: {}, 2: {} },
        lockedGroups: { 1: {}, 2: {} },
        togetherPairs: { 1: [], 2: [] },
        separatePairs: { 1: [], 2: [] },
        closedSubjects: { 1: [], 2: [] },
        _closedImportedFromPrev: false,
        subjectMemos: { 1: {}, 2: {} },
        studentPins: [],
        currentPlan: {
          semester: 1,
          groups: [],
          conflicts: [],
          timestamp: null
        },
        currentPlans: {
          1: null,
          2: null
        },
        crossSemesterRules: [],
        step2Memos: { 1: '', 2: '' },
        step2NoticeList: [],
        priorData: null,
        crossCheckResult: {
          missingStudents: [],
          duplicateEnrollments: []
        },
        savedPlans: [],
        targetConflictN: {
          1: null,
          2: null
        },
        simulationHistory: {
          1: { runCount: 0, minConflictEver: null, minConflictPlan: null },
          2: { runCount: 0, minConflictEver: null, minConflictPlan: null }
        },
        lastUpdated: new Date().toISOString()
      };
    }
    window.createEmptyGradeState = createEmptyGradeState;

    function getActiveAcademicYearName() {
      if (typeof MultiState !== "undefined" && MultiState && MultiState.activeAcademicYear) {
        return MultiState.activeAcademicYear.trim();
      }
      const y = (typeof MultiState !== "undefined" && MultiState && MultiState.activeYear) 
        ? String(MultiState.activeYear).replace(/[^0-9]/g, "").slice(0, 4) 
        : "2027";
      return (y || "2027") + "학년도";
    }
    window.getActiveAcademicYearName = getActiveAcademicYearName;

    function getFormattedTimestamp() {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const hh = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
    }
    window.getFormattedTimestamp = getFormattedTimestamp;

    function buildExportFileName(title, ext = "xlsx") {
      const acadYear = getActiveAcademicYearName();
      const ts = getFormattedTimestamp();
      const cleanExt = ext.replace(/^\./, "");
      let cleanTitle = String(title || "").trim();
      if (acadYear && cleanTitle.startsWith(acadYear)) {
        cleanTitle = cleanTitle.slice(acadYear.length).replace(/^[\s_]+/, "");
      }
      return `${acadYear} ${cleanTitle}_${ts}.${cleanExt}`;
    }
    window.buildExportFileName = buildExportFileName;

    // MultiState: 상위 기준 학년도 / 하위 기준 날짜 / 학년 / 전체 관리 최상위 상태
    const MultiState = {
      academicYearsList: ['2027학년도'], // 상위: 기준 학년도 목록
      activeAcademicYear: '2027학년도', // 현재 활성 기준 학년도
      datesByAcademicYear: {
        '2027학년도': ['2027.10.11.']
      },
      curriculumByAcademicYear: {
        '2027학년도': [] // '전체 시수 종합' 기초 데이터 (해당 학년도 하위 모든 날짜 탭에서 100% 공유)
      },
      subjectGroupsByAcademicYear: {}, // 교과군 설정 및 과목별 교과군 배정 데이터 (학년도별 영구 보존)
      customTeacherOrder: [], // 교사별 요약표 출력 순서 (모든 탭에서 영구 전역 공유)
      activeYear: '2027.10.11.', // 하위: 현재 활성 기준 날짜
      activeGrade: '2학년', // 기본 2학년 ('2학년' | '3학년' | '전체')
      activeStep: 1, // 1: 1단계(수강신청 매트릭스), 2: 2단계(과목 그룹핑 & 분반)
      yearsList: ['2027.10.11.'], // 현재 학년도의 기준 날짜 목록
      data: {
        '2027학년도': {
          '2027.10.11.': {
            '2학년': null,
            '3학년': null,
            '전체': null
          }
        }
      },
      lastUpdated: new Date().toISOString()
    };
    window.MultiState = MultiState;

    // 학년도별 데이터 격리 접근 헬퍼 (하위 탭 이름이 동일해도 학년도 간 충돌 0% 보장)
    function getAcadData(acadYear = null) {
      const ay = acadYear || MultiState.activeAcademicYear || '2027학년도';
      if (!MultiState.data || typeof MultiState.data !== 'object') MultiState.data = {};
      if (!MultiState.data[ay] || typeof MultiState.data[ay] !== 'object') MultiState.data[ay] = {};
      return MultiState.data[ay];
    }
    window.getAcadData = getAcadData;

    // 이전 버전(단일 flat 구조)의 데이터를 학년도별 격리 구조로 자동 마이그레이션 (하위 호환성 100%)
    function migrateDataStructure(dataObj, fallbackAY = '2027학년도') {
      if (!dataObj || typeof dataObj !== 'object') return {};
      const keys = Object.keys(dataObj);
      if (keys.length === 0) return {};
      
      const hasAcademicYearKeys = keys.some(k => k.includes('학년도'));
      if (!hasAcademicYearKeys) {
        const migrated = {};
        migrated[fallbackAY] = JSON.parse(JSON.stringify(dataObj));
        return migrated;
      }
      return JSON.parse(JSON.stringify(dataObj));
    }
    window.migrateDataStructure = migrateDataStructure;

    const STORAGE_KEY = 'SANGJI_COURSE_REG_MULTI_V6';
    const FIREBASE_CONFIG_KEY = 'SANGJI_FIREBASE_CONFIG_V1';

    // Cloud Sync Manager (보안 원칙: 웹상/원격에 데이터를 자동 보관하지 않음)
    class CourseCloudSync {
      constructor() {
        this.firebaseApp = null;
        this.firestoreDb = null;
        this.isSyncing = false;
        this.status = 'local';
      }
      async init() { this.status = 'local'; }
      updateUiBadge() {}
      async save() {}
      subscribeRemote() {}
    }

    const cloudSync = new CourseCloudSync();
    window.cloudSync = cloudSync;

    // Global Application State (단일 학년 컨텍스트)
    const AppState = createEmptyGradeState('2학년');
    window.AppState = AppState;
