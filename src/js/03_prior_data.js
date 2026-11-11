    // 0. PRIOR DATA (학생 명부 & 기이수 과목) & CROSS-CHECK ENGINE
    // ==========================================

    // 특수문자/각주 기호/별표 정규식 (*, ※, †, ‡, ★, ☆, ▲, ■, ●, #, ^ 등)
    const SUBJECT_SPECIAL_CHARS_REGEX = /[*※†‡★☆▲■●#^]/g;

    // 분반 및 학점 표기 제거한 기본 과목명 추출
    function getBaseSubjectName(subj) {
      if (!subj) return '';
      let s = String(subj).replace(/[\r\n\t]/g, ' ');
      s = s.replace(SUBJECT_SPECIAL_CHARS_REGEX, '').trim();
      s = s
        .replace(/[-_]\s*(\d+|[A-Z]|[0-9]+반|[A-Z]반|\d+분반)\s*$/i, '')
        .replace(/\s*\(\s*(\d+|[A-Z]|\d+반|\d+분반|수정|추가|신설)\s*\)\s*$/i, '')
        .replace(/[\(\[]\s*\d+(?:\.\d+)?\s*(?:학점|단위)?\s*[\)\]]$/, '')
        .trim();
      return s.replace(SUBJECT_SPECIAL_CHARS_REGEX, '').trim();
    }

    function getSubjectDivision(subj) {
      if (!subj) return '';
      let s = String(subj).replace(/[\r\n\t]/g, ' ').replace(SUBJECT_SPECIAL_CHARS_REGEX, '').trim();
      const m1 = s.match(/[-_]\s*(\d+|[A-Z]|[0-9]+반|[A-Z]반|\d+분반)\s*$/i);
      if (m1) return m1[1];
      const m2 = s.match(/\s*\(\s*(\d+|[A-Z]|\d+반|\d+분반)\s*\)\s*$/i);
      if (m2) return m2[1];
      return '';
    }

    // 과목명 정규화: 띄어쓰기(전각/줄바꿈 포함) 무시, 학점수 괄호 무시, 분반 접미사 무시, 특수문자 무시, 로마숫자 통일, 영문 소문자화
    function normalizeSubject(s) {
      if (!s) return '';
      let base = getBaseSubjectName(s);
      base = base
        .replace(/[\s\u3000\u00A0]/g, '')
        .replace(SUBJECT_SPECIAL_CHARS_REGEX, '')
        .replace(/IV/gi, 'Ⅳ').replace(/III/gi, 'Ⅲ').replace(/II/gi, 'Ⅱ').replace(/I/gi, 'Ⅰ')
        .toLowerCase();
      return base;
    }

    function normalizeSubjectKey(subj) {
      return normalizeSubject(subj);
    }

    function processPriorDataFiles(fileList) {
      if (!fileList || fileList.length === 0) return;
      if (typeof XLSX === 'undefined') {
        alert('엑셀 처리 라이브러리를 준비 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      const files = Array.from(fileList);
      showLoading(`사전 데이터 파일 (${files.length}개) 분석 중...`);

      const readers = files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({ file, data: new Uint8Array(e.target.result) });
          reader.onerror = () => reject(new Error(`[${file.name}] 파일을 읽는 데 실패했습니다.`));
          reader.readAsArrayBuffer(file);
        });
      });

      Promise.all(readers).then(results => {
        setTimeout(() => {
          try {
            const activeG = MultiState.activeGrade || '2학년';
            const allParsedStudents = [];
            const fileNames = [];

            results.forEach(({ file, data }) => {
              fileNames.push(file.name);
              const workbook = XLSX.read(data, { type: 'array' });
              const students = parsePriorWorkbook(workbook, file.name, activeG);
              students.forEach(st => allParsedStudents.push(st));
            });

            if (allParsedStudents.length === 0) {
              alert('사전 엑셀 파일에서 학생 정보를 읽어오지 못했습니다. 서식 및 열 항목을 확인해주세요.');
              return;
            }

            mergeAndSavePriorData(allParsedStudents, fileNames, activeG);
          } catch (err) {
            console.error(err);
            alert('사전 데이터 엑셀 파일을 읽는 도중 오류가 발생했습니다: ' + err.message);
          } finally {
            hideLoading();
            const pInput = document.getElementById('priorFileInput');
            if (pInput) pInput.value = '';
          }
        }, 60);
      }).catch(err => {
        hideLoading();
        alert(err.message);
        const pInput = document.getElementById('priorFileInput');
        if (pInput) pInput.value = '';
      });
    }

    function processPriorDataFile(file, targetSemester = 1) {
      if (!file) return;
      processPriorDataFiles([file]);
    }

    function computePriorSemesterStats(pd) {
      if (!pd || !Array.isArray(pd.students)) {
        return {
          sem1FileName: '', sem1StCount: 0, sem1RecCount: 0,
          sem2FileName: '', sem2StCount: 0, sem2RecCount: 0
        };
      }
      const sem1StSet = new Set();
      const sem2StSet = new Set();
      let sem1Rec = 0;
      let sem2Rec = 0;

      pd.students.forEach(st => {
        if (!st) return;
        const stKey = st.key || `${st.classNum}_${st.studentNum}_${st.name}`;
        if (Array.isArray(st.courseDetails) && st.courseDetails.length > 0) {
          st.courseDetails.forEach(cd => {
            if (!cd) return;
            const sNum = Number(cd.uploadSem || cd.semester || 1);
            if (sNum === 2) {
              sem2Rec++;
              sem2StSet.add(stKey);
            } else {
              sem1Rec++;
              sem1StSet.add(stKey);
            }
          });
        } else if (Array.isArray(st.rawSubjects) && st.rawSubjects.length > 0) {
          sem1Rec += st.rawSubjects.length;
          sem1StSet.add(stKey);
        }
      });

      return {
        sem1FileName: pd.sem1FileName || (sem1Rec > 0 ? (pd.fileName || '사전데이터') : ''),
        sem1StCount: pd.sem1StudentCount || sem1StSet.size,
        sem1RecCount: pd.sem1RecordCount || sem1Rec,
        sem2FileName: pd.sem2FileName || (sem2Rec > 0 ? (pd.fileName || '사전데이터') : ''),
        sem2StCount: pd.sem2StudentCount || sem2StSet.size,
        sem2RecCount: pd.sem2RecordCount || sem2Rec
      };
    }

    function updatePriorDataUI() {
      const priorStatusBadge = document.getElementById('priorStatusBadge');
      const priorUploadZone = document.getElementById('priorUploadZone');
      const priorLoadedInfo = document.getElementById('priorLoadedInfo');
      const priorLoadedSummary = document.getElementById('priorLoadedSummary');
      const priorLoadedFileName = document.getElementById('priorLoadedFileName');
      const priorClassBadges = document.getElementById('priorClassBadges');
      const priorCardTitle = document.getElementById('priorCardTitle');
      const priorCardGradeBadge = document.getElementById('priorCardGradeBadge');
      const priorCardDesc = document.getElementById('priorCardDesc');
      const surveyCardTitle = document.getElementById('surveyCardTitle');
      const surveyCardGradeBadge = document.getElementById('surveyCardGradeBadge');
      const pFileInput = document.getElementById('priorFileInput');

      const activeG = MultiState.activeGrade || '2학년';

      if (priorCardTitle) priorCardTitle.textContent = `[${activeG}] 사전 데이터 등록`;
      if (priorCardGradeBadge) { priorCardGradeBadge.textContent = ""; priorCardGradeBadge.classList.add("hidden"); }
      if (priorCardDesc) {
        priorCardDesc.textContent = (activeG === '2학년')
          ? '1학년 학생 명부 등록 (반별 엑셀 파일 다중 등록 지원)'
          : '2학년 학생 명부 및 기이수 과목 등록 (반별 엑셀 파일 다중 등록 지원)';
      }
      if (surveyCardTitle) surveyCardTitle.textContent = `[${activeG}] 수강신청 조사 엑셀 파일`;
      if (surveyCardGradeBadge) { surveyCardGradeBadge.textContent = ""; surveyCardGradeBadge.classList.add("hidden"); }

      if (AppState.priorData && AppState.priorData.students && AppState.priorData.students.length > 0) {
        if (priorStatusBadge) priorStatusBadge.classList.remove('hidden');
        if (priorUploadZone) priorUploadZone.classList.remove('hidden');
        if (priorLoadedInfo) priorLoadedInfo.classList.remove('hidden');

        const stCount = AppState.priorData.students.length;
        const recCount = AppState.priorData.totalRecords || 0;

        if (priorLoadedSummary) {
          if (activeG === '2학년') {
            priorLoadedSummary.textContent = `[${activeG}] 등록 학생(1학년 명부): 총 ${stCount}명`;
          } else {
            priorLoadedSummary.textContent = `[${activeG}] 등록 학생: 총 ${stCount}명 | 이수 기록: ${recCount}건`;
          }
        }

        if (priorClassBadges) {
          priorClassBadges.innerHTML = '';
          const classCounts = AppState.priorData.classCounts || {};
          const cKeys = Object.keys(classCounts).sort((a, b) => Number(a) - Number(b));
          if (cKeys.length > 0) {
            cKeys.forEach(c => {
              const pill = document.createElement('span');
              pill.className = 'px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[10px] border border-indigo-200';
              pill.textContent = `${c}반 ${classCounts[c]}명`;
              priorClassBadges.appendChild(pill);
            });
          }
        }

        if (priorLoadedFileName) {
          const fNames = (AppState.priorData.uploadedFiles && AppState.priorData.uploadedFiles.length > 0)
            ? AppState.priorData.uploadedFiles.join(', ')
            : (AppState.priorData.fileName || '사전데이터.xlsx');
          priorLoadedFileName.textContent = `📁 ${fNames}`;
          priorLoadedFileName.title = fNames;
        }
      } else {
        if (priorStatusBadge) priorStatusBadge.classList.add('hidden');
        if (priorUploadZone) priorUploadZone.classList.remove('hidden');
        if (priorLoadedInfo) priorLoadedInfo.classList.add('hidden');
        if (priorClassBadges) priorClassBadges.innerHTML = '';
        if (pFileInput) pFileInput.value = '';
      }

      if (AppState.students && AppState.students.length > 0 && AppState.priorData) {
        runCrossCheckAnalysis();
      } else {
        const crossCheckAlertPanel = document.getElementById('crossCheckAlertPanel');
        if (crossCheckAlertPanel) crossCheckAlertPanel.classList.add('hidden');
      }

      updateSurveyDataUI();
    }
    window.updatePriorDataUI = updatePriorDataUI;

    function updateSurveyDataUI() {
      const surveyStatusBadge = document.getElementById('surveyStatusBadge');
      const surveyLoadedInfo = document.getElementById('surveyLoadedInfo');
      const surveyLoadedSummary = document.getElementById('surveyLoadedSummary');
      const surveyLoadedFileName = document.getElementById('surveyLoadedFileName');
      const activeG = MultiState.activeGrade || '2학년';

      if (AppState.students && AppState.students.length > 0) {
        if (surveyStatusBadge) surveyStatusBadge.classList.remove('hidden');
        if (surveyLoadedInfo) surveyLoadedInfo.classList.remove('hidden');
        const stCount = AppState.students.length;
        const s1Count = Array.isArray(AppState.sem1Subjects) ? AppState.sem1Subjects.length : 0;
        const s2Count = Array.isArray(AppState.sem2Subjects) ? AppState.sem2Subjects.length : 0;
        if (surveyLoadedSummary) {
          surveyLoadedSummary.textContent = `📊 [${activeG}] 응답 학생: ${stCount}명 | 1학기 ${s1Count}과목 · 2학기 ${s2Count}과목`;
        }
        const fName = AppState.fileName || `${activeG}_수강신청_조사파일.xlsx`;
        if (surveyLoadedFileName) {
          surveyLoadedFileName.textContent = `📁 등록 파일: ${fName} (새 파일 업로드 시 교체)`;
          surveyLoadedFileName.title = fName;
        }
      } else {
        if (surveyStatusBadge) surveyStatusBadge.classList.add('hidden');
        if (surveyLoadedInfo) surveyLoadedInfo.classList.add('hidden');
        if (fileInput) fileInput.value = '';
      }
    }
    window.updateSurveyDataUI = updateSurveyDataUI;

    function clearSurveyData() {
      AppState.fileName = '';
      AppState.students = [];
      AppState.sem1Subjects = [];
      AppState.sem2Subjects = [];
      AppState.splitSubjects = { 1: {}, 2: {} };
      AppState.pinnedSubjects = { 1: {}, 2: {} };
      AppState.closedSubjects = { 1: [], 2: [] };
      AppState._closedImportedFromPrev = false;
      AppState._surveyCleared = true;
      AppState.subjectMemos = { 1: {}, 2: {} };
      AppState.studentPins = [];
      AppState.savedPlans = [];
      AppState.currentPlan = null;
      AppState.currentPlans = { 1: null, 2: null };

      if (fileInput) fileInput.value = '';
      if (restoredBadge) restoredBadge.classList.add('hidden');
      if (appBody) appBody.classList.add('hidden');

      const hasPrior = !!(AppState.priorData && AppState.priorData.students && AppState.priorData.students.length > 0);
      if (btnResetAll) {
        if (hasPrior) btnResetAll.classList.remove('hidden');
        else btnResetAll.classList.add('hidden');
      }

      updatePriorDataUI();
      saveAllState();
      if (typeof renderYearGradeNav === 'function') renderYearGradeNav();
      if (typeof updateModalStats === 'function') updateModalStats();
    }
    window.clearSurveyData = clearSurveyData;

    function rebuildPriorDataFromStudents(studentsArray, meta = {}) {
      const courseCatalogMap = new Map();
      let totalRecords = 0;

      const cleanedStudents = [];
      (studentsArray || []).forEach(st => {
        if (!st) return;
        const details = Array.isArray(st.courseDetails) ? st.courseDetails : [];
        const normSet = new Set();
        const rawList = [];

        details.forEach(cd => {
          if (!cd || !cd.subject) return;
          totalRecords++;
          const normS = cd.normSubject || normalizeSubject(cd.subject);
          if (normS) normSet.add(normS);
          rawList.push(cd.rawSubject || cd.subject);

          const catalogGrade = cd.grade || '1학년';
          const catalogSem = Number(cd.uploadSem || cd.semester || 1);
          const catalogKey = `${catalogGrade}::${catalogSem}학기::${cd.subject}`;
          if (!courseCatalogMap.has(catalogKey)) {
            courseCatalogMap.set(catalogKey, {
              key: catalogKey,
              subject: cd.subject,
              rawSubject: cd.rawSubject || cd.subject,
              grade: catalogGrade,
              semester: catalogSem,
              credit: cd.credit || 0,
              organization: cd.organization || '',
              classroom: cd.classroom || '',
              year: cd.year || '',
              source: cd.source || '사전데이터'
            });
          }
        });

        if (details.length > 0) {
          cleanedStudents.push({
            ...st,
            subjects: Array.from(normSet),
            rawSubjects: rawList,
            courseDetails: details
          });
        }
      });

      const coursesList = Array.from(courseCatalogMap.values());
      const fileParts = [];
      if (meta.sem1FileName) fileParts.push(`[1학기] ${meta.sem1FileName}`);
      if (meta.sem2FileName) fileParts.push(`[2학기] ${meta.sem2FileName}`);

      return {
        fileName: fileParts.join(' + ') || meta.fallbackFileName || '사전데이터.xlsx',
        sem1FileName: meta.sem1FileName || '',
        sem1StudentCount: meta.sem1StudentCount || 0,
        sem1RecordCount: meta.sem1RecordCount || 0,
        sem2FileName: meta.sem2FileName || '',
        sem2StudentCount: meta.sem2StudentCount || 0,
        sem2RecordCount: meta.sem2RecordCount || 0,
        students: cleanedStudents,
        totalRecords,
        courses: coursesList,
        subjects: Array.from(new Set(coursesList.map(c => c.subject)))
      };
    }

    function parsePriorWorkbook(workbook, fileName, activeGrade) {
      const activeG = activeGrade || MultiState.activeGrade || '2학년';
      const parsedStudents = [];

      for (const sName of workbook.SheetNames) {
        const s = workbook.Sheets[sName];
        if (!s) continue;
        const rows = XLSX.utils.sheet_to_json(s, { header: 1 });
        if (!rows || rows.length < 2) continue;

        // 구버전 NEIS 서식 확인 (수강생편성-학생편성현황)
        let isLegacyFormat = false;
        let legacyHeaderIdx = -1;
        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const rowStr = (rows[r] || []).map(c => String(c || '')).join(' ');
          if ((rowStr.includes('개설과목') || rowStr.includes('편제')) && (rowStr.includes('성명') || rowStr.includes('이름')) && rowStr.includes('반')) {
            isLegacyFormat = true;
            legacyHeaderIdx = r;
            break;
          }
        }

        if (isLegacyFormat) {
          const legStudents = parseLegacyPriorRows(rows, legacyHeaderIdx, activeG);
          legStudents.forEach(st => parsedStudents.push(st));
          continue;
        }

        // 신규 서식: 3행 또는 상단 10행에서 [n학년 n반] 감지
        let detectedClass = '';
        let detectedGrade = '';

        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const rowStr = (rows[r] || []).map(c => String(c || '').trim()).join(' ');
          if (/출력일시|인쇄일시|페이지|\d{4}[.-]\d{2}[.-]\d{2}/.test(rowStr) && !rowStr.includes('반')) continue;

          const m1 = rowStr.match(/([1-3])\s*학년(?![도제])\s*(\d+)\s*반/);
          if (m1) {
            detectedGrade = m1[1] + '학년';
            detectedClass = String(parseInt(m1[2], 10));
            break;
          }
          const m2 = rowStr.match(/([1-3])\s*[-_]\s*(\d+)(?:\s*반)?/);
          if (m2) {
            detectedGrade = m2[1] + '학년';
            detectedClass = String(parseInt(m2[2], 10));
            break;
          }
        }

        if (!detectedClass) {
          for (let r = 0; r < Math.min(rows.length, 10); r++) {
            const rowStr = (rows[r] || []).map(c => String(c || '').trim()).join(' ');
            if (/출력일시|인쇄일시|페이지|\d{4}[.-]\d{2}[.-]\d{2}/.test(rowStr) && !rowStr.includes('반')) continue;
            const m3 = rowStr.match(/(?:^|\s)(\d+)\s*반/);
            if (m3 && !rowStr.includes('편제')) {
              detectedClass = String(parseInt(m3[1], 10));
              break;
            }
          }
        }

        if (!detectedClass) {
          const mSheet = sName.match(/([1-3])\s*[-_]\s*(\d+)/) || sName.match(/(\d+)\s*반/);
          if (mSheet) {
            if (mSheet.length > 2) {
              detectedGrade = mSheet[1] + '학년';
              detectedClass = String(parseInt(mSheet[2], 10));
            } else {
              detectedClass = String(parseInt(mSheet[1], 10));
            }
          }
        }

        if (!detectedClass) {
          const mFile = fileName.match(/([1-3])\s*학년(?![도제])\s*(\d+)\s*반/) || fileName.match(/([1-3])\s*[-_]\s*(\d+)/) || fileName.match(/(\d+)\s*반/);
          if (mFile) {
            if (mFile.length > 2) {
              detectedGrade = mFile[1] + '학년';
              detectedClass = String(parseInt(mFile[2], 10));
            } else {
              detectedClass = String(parseInt(mFile[1], 10));
            }
          }
        }

        if (!detectedClass) detectedClass = '1';

        // 헤더 행 탐색
        let headerRowIndex = -1;
        for (let r = 0; r < Math.min(rows.length, 15); r++) {
          const row = (rows[r] || []).map(c => String(c || '').replace(/\s+/g, ''));
          const hasNum = row.some(c => c === '번호' || c === '학번');
          const hasName = row.some(c => c === '성명' || c === '이름');
          const hasSubjOrCat = row.some(c => c.includes('과목') || c.includes('교과') || c.includes('학점') || c.includes('학년'));
          if (hasNum && hasName && hasSubjOrCat) {
            headerRowIndex = r;
            break;
          }
        }

        if (headerRowIndex === -1) {
          continue;
        }

        const headerRow = rows[headerRowIndex].map(c => String(c || '').replace(/\s+/g, ''));
        let colNum = -1, colName = -1, colGrade = -1, colSem = -1, colCat = -1, colSubj = -1, colCredit = -1;
        headerRow.forEach((h, idx) => {
          if (/^번호$|^학번$/.test(h)) colNum = idx;
          else if (/^성명$|^이름$/.test(h)) colName = idx;
          else if (/^학년$/.test(h)) colGrade = idx;
          else if (/^학기$/.test(h)) colSem = idx;
          else if (/^교과$/.test(h)) colCat = idx;
          else if (/^과목$|^과목명$|^개설과목$/.test(h)) colSubj = idx;
          else if (/^학점$|^단위|^단위수$/.test(h)) colCredit = idx;
        });

        let currNum = '';
        let currName = '';
        let currGrade = detectedGrade || (activeG === '3학년' ? '2학년' : '1학년');
        let currSem = 1;

        const dataRows = rows.slice(headerRowIndex + 1);
        dataRows.forEach(row => {
          if (!row || row.length === 0) return;

          // 중간에 다시 등장하는 반복 헤더 행 건너뛰기
          const rowCompact = row.map(c => String(c || '').replace(/\s+/g, ''));
          if (rowCompact.some(c => c === '번호' || c === '학번') && rowCompact.some(c => c === '성명' || c === '이름')) {
            return;
          }

          // Forward-fill 번호
          if (colNum !== -1 && row[colNum] !== undefined && String(row[colNum]).trim() !== '') {
            const rawNumStr = String(row[colNum]).trim();
            const parsed = parseInt(rawNumStr.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsed)) currNum = String(parsed);
          }

          // Forward-fill 성명
          if (colName !== -1 && row[colName] !== undefined && String(row[colName]).trim() !== '') {
            const rawName = String(row[colName]).trim();
            if (!/합계|소계|평균|비고/.test(rawName)) {
              currName = rawName;
            }
          }

          // Forward-fill 학년
          if (colGrade !== -1 && row[colGrade] !== undefined && String(row[colGrade]).trim() !== '') {
            const gNum = String(row[colGrade]).replace(/[^0-9]/g, '');
            if (gNum) currGrade = `${gNum}학년`;
          }

          // Forward-fill 학기
          if (colSem !== -1 && row[colSem] !== undefined && String(row[colSem]).trim() !== '') {
            const sStr = String(row[colSem]).trim();
            if (sStr.includes('2')) currSem = 2;
            else if (sStr.includes('1')) currSem = 1;
          }

          if (!currNum || !currName) return;

          const stKey = `${detectedClass}_${currNum}_${currName}`;
          let stObj = parsedStudents.find(s => s.key === stKey);
          if (!stObj) {
            stObj = {
              key: stKey,
              grade: activeG,
              classNum: detectedClass,
              studentNum: currNum,
              name: currName,
              subjects: [],
              rawSubjects: [],
              courseDetails: []
            };
            parsedStudents.push(stObj);
          }

          // [2학년] 사전데이터 등록 시: 공통과목만 듣는 1학년 대상이므로 학생 명부(반, 번호, 성명)만 등록하고 과목 취합 생략!
          if (activeG === '2학년') {
            return;
          }

          // [3학년] 사전데이터 등록 시: 기이수 과목, 학점, 학기 취합
          if (colSubj !== -1 && row[colSubj] !== undefined) {
            const rawSubj = String(row[colSubj]).trim();
            if (!rawSubj || /합계|소계|평균/.test(rawSubj)) return;

            let creditVal = 0;
            if (colCredit !== -1 && row[colCredit] !== undefined) {
              creditVal = parseFloat(String(row[colCredit]).replace(/[^0-9.]/g, '')) || 0;
            }
            const catVal = colCat !== -1 && row[colCat] !== undefined ? String(row[colCat]).trim() : '';
            const cleanSubj = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(rawSubj) : rawSubj;
            const normSubj = (typeof normalizeSubject === 'function') ? normalizeSubject(cleanSubj || rawSubj) : (cleanSubj || rawSubj).replace(/\s+/g, '').toLowerCase();

            if (normSubj && !stObj.subjects.includes(normSubj)) {
              stObj.subjects.push(normSubj);
            }
            stObj.rawSubjects.push(cleanSubj || rawSubj);
            stObj.courseDetails.push({
              subject: cleanSubj || rawSubj,
              rawSubject: rawSubj,
              normSubject: normSubj,
              credit: creditVal,
              category: catVal,
              semester: currSem,
              uploadSem: currSem,
              grade: currGrade,
              classNum: detectedClass,
              studentNum: currNum
            });
          }
        });
      }

      return parsedStudents;
    }

    // 구버전 NEIS 서식 호환 파서
    function parseLegacyPriorRows(rows, headerRowIndex, activeG) {
      const headers = rows[headerRowIndex].map(h => (h !== undefined && h !== null ? String(h).trim() : ''));
      const dataRows = rows.slice(headerRowIndex + 1);

      let colYear = -1, colGrade = -1, colOrg = -1, colSubject = -1, colClassroom = -1, colGradeDept = -1, colClass = -1, colNum = -1, colName = -1;
      headers.forEach((h, idx) => {
        if (/학년도|연도/.test(h)) colYear = idx;
        else if (/^학년$|학년\s*\(/.test(h)) colGrade = idx;
        else if (/편제명|편제/.test(h)) colOrg = idx;
        else if (/개설\s*과목|과목명|^과목$/.test(h)) colSubject = idx;
        else if (/개설\s*강의실|강의실/.test(h)) colClassroom = idx;
        else if (/계열.*학년.*학과|계열|학과/.test(h)) colGradeDept = idx;
        else if (/^반$|반\s*\(/.test(h)) colClass = idx;
        else if (/^번호$|번호\s*\(/.test(h)) colNum = idx;
        else if (/성명|이름/.test(h)) colName = idx;
      });

      const studentsMap = new Map();

      dataRows.forEach((row) => {
        if (!row || row.length === 0) return;
        const nameVal = colName !== -1 ? String(row[colName] || '').trim() : '';
        if (!nameVal || /성명|이름|합계|소계|평균/.test(nameVal)) return;

        let classVal = colClass !== -1 ? String(row[colClass] || '').replace(/[^0-9]/g, '') : '';
        const numVal = colNum !== -1 ? String(row[colNum] || '').replace(/[^0-9]/g, '') : '';
        if (!classVal && !numVal) return;

        if (classVal.length === 3) {
          classVal = String(parseInt(classVal.slice(1), 10));
        }

        const subjectVal = colSubject !== -1 ? String(row[colSubject] || '').trim() : '';
        const yearVal = colYear !== -1 ? String(row[colYear] || '').trim() : '';
        const gradeVal = colGrade !== -1 ? String(row[colGrade] || '').replace(/[^0-9]/g, '') : '';
        const orgVal = colOrg !== -1 ? String(row[colOrg] || '').trim() : '';
        const roomVal = colClassroom !== -1 ? String(row[colClassroom] || '').trim() : '';

        let creditVal = 0;
        const creditMatch = subjectVal.match(/[\(\[]\s*(\d+(?:\.\d+)?)\s*(?:학점|단위)?[\)\]]/);
        if (creditMatch) {
          creditVal = parseFloat(creditMatch[1]);
        }
        const cleanSubj = (typeof getBaseSubjectName === 'function') ? getBaseSubjectName(subjectVal) : subjectVal.replace(/[\(\[].*?[\)\]]/g, '').trim();

        const key = `${classVal}_${numVal}_${nameVal}`;

        if (!studentsMap.has(key)) {
          studentsMap.set(key, {
            key,
            grade: activeG,
            classNum: classVal,
            studentNum: numVal,
            name: nameVal,
            subjects: [],
            rawSubjects: [],
            courseDetails: []
          });
        }

        if (activeG === '2학년') return;

        const stObj = studentsMap.get(key);
        if (subjectVal) {
          const normSubj = (typeof normalizeSubject === 'function') ? normalizeSubject(subjectVal) : subjectVal.replace(/\s+/g, '').toLowerCase();
          if (normSubj && !stObj.subjects.includes(normSubj)) {
            stObj.subjects.push(normSubj);
          }
          stObj.rawSubjects.push(subjectVal);

          stObj.courseDetails.push({
            subject: cleanSubj || subjectVal,
            rawSubject: subjectVal,
            normSubject: normSubj,
            credit: creditVal,
            semester: 1,
            uploadSem: 1,
            grade: gradeVal ? (gradeVal.includes('학년') ? gradeVal : gradeVal + '학년') : '',
            organization: orgVal,
            classroom: roomVal,
            year: yearVal
          });
        }
      });

      return Array.from(studentsMap.values());
    }

    // 신규 파싱 데이터와 기존 사전데이터 병합 및 저장
    function mergeAndSavePriorData(allParsedStudents, fileNames, activeG) {
      const activeYear = MultiState.activeYear || '2027';
      const curAcadData = getAcadData();
      if (!curAcadData[activeYear]) curAcadData[activeYear] = {};
      if (!curAcadData[activeYear][activeG]) curAcadData[activeYear][activeG] = createEmptyGradeState(activeG);
      const existingPrior = curAcadData[activeYear][activeG].priorData || AppState.priorData;

      // 이번 업로드에 포함된 반 목록
      const uploadedClasses = new Set(allParsedStudents.map(st => String(st.classNum)));

      const mergedStudentsMap = new Map();

      // 기존 데이터 중 이번에 업로드되지 않은 다른 반의 학생들은 안전하게 유지!
      if (existingPrior && Array.isArray(existingPrior.students)) {
        existingPrior.students.forEach(oldSt => {
          if (!oldSt) return;
          if (!uploadedClasses.has(String(oldSt.classNum))) {
            const key = oldSt.key || `${oldSt.classNum}_${oldSt.studentNum}_${oldSt.name}`;
            mergedStudentsMap.set(key, JSON.parse(JSON.stringify(oldSt)));
          }
        });
      }

      // 이번에 파싱된 신규 학생 데이터 병합 (동일 학생이 여러 행/섹션에 걸쳐 등장한 경우 과목 누적)
      allParsedStudents.forEach(newSt => {
        const key = newSt.key || `${newSt.classNum}_${newSt.studentNum}_${newSt.name}`;
        if (!mergedStudentsMap.has(key)) {
          mergedStudentsMap.set(key, newSt);
        } else {
          const exSt = mergedStudentsMap.get(key);
          if (Array.isArray(newSt.courseDetails) && newSt.courseDetails.length > 0) {
            if (!Array.isArray(exSt.courseDetails)) exSt.courseDetails = [];
            if (!Array.isArray(exSt.subjects)) exSt.subjects = [];
            if (!Array.isArray(exSt.rawSubjects)) exSt.rawSubjects = [];
            newSt.courseDetails.forEach(newCd => {
              exSt.courseDetails.push(newCd);
              if (newCd.normSubject && !exSt.subjects.includes(newCd.normSubject)) {
                exSt.subjects.push(newCd.normSubject);
              }
              if (newCd.rawSubject) exSt.rawSubjects.push(newCd.rawSubject);
            });
          }
        }
      });

      // 반(classNum) 오름차순, 번호(studentNum) 오름차순 정렬
      const finalStudentList = Array.from(mergedStudentsMap.values());
      finalStudentList.sort((a, b) => {
        const cA = parseInt(String(a.classNum || '0').replace(/[^0-9]/g, ''), 10) || 0;
        const cB = parseInt(String(b.classNum || '0').replace(/[^0-9]/g, ''), 10) || 0;
        if (cA !== cB) return cA - cB;
        const nA = parseInt(String(a.studentNum || '0').replace(/[^0-9]/g, ''), 10) || 0;
        const nB = parseInt(String(b.studentNum || '0').replace(/[^0-9]/g, ''), 10) || 0;
        return nA - nB;
      });

      // 반별 학생 수 집계
      const classCounts = {};
      finalStudentList.forEach(st => {
        const c = String(st.classNum || '1');
        classCounts[c] = (classCounts[c] || 0) + 1;
      });
      const classSummaryStr = Object.keys(classCounts).sort((a, b) => Number(a) - Number(b)).map(c => `${c}반: ${classCounts[c]}명`).join(', ');

      // 통계 계산
      let totalRecords = 0;
      let s1Records = 0;
      let s2Records = 0;
      finalStudentList.forEach(st => {
        (st.courseDetails || []).forEach(cd => {
          totalRecords++;
          if (Number(cd.uploadSem || cd.semester || 1) === 2) s2Records++;
          else s1Records++;
        });
      });

      // 파일명 통합
      const existingFileNames = (existingPrior?.uploadedFiles || (existingPrior?.fileName ? [existingPrior.fileName] : []));
      const combinedFiles = Array.from(new Set([...existingFileNames, ...fileNames])).filter(Boolean);
      const fileNameStr = combinedFiles.join(', ') || `${activeG}_사전데이터.xlsx`;

      const meta = {
        fileName: fileNameStr,
        sem1FileName: s1Records > 0 ? fileNameStr : '',
        sem1StudentCount: finalStudentList.length,
        sem1RecordCount: s1Records,
        sem2FileName: s2Records > 0 ? fileNameStr : '',
        sem2StudentCount: finalStudentList.length,
        sem2RecordCount: s2Records,
        classCounts,
        uploadedFiles: combinedFiles,
        fallbackFileName: fileNameStr
      };

      const priorDataObj = rebuildPriorDataFromStudents(finalStudentList, meta);
      priorDataObj.classCounts = classCounts;
      priorDataObj.uploadedFiles = combinedFiles;

      curAcadData[activeYear][activeG].priorData = priorDataObj;
      AppState.priorData = priorDataObj;

      // 2학년인 경우 1학년에도 사전데이터를 동기화하여 전체 시수종합 연동 보장
      if (activeG === '2학년') {
        if (!curAcadData[activeYear]['1학년']) curAcadData[activeYear]['1학년'] = createEmptyGradeState('1학년');
        curAcadData[activeYear]['1학년'].priorData = JSON.parse(JSON.stringify(priorDataObj));
      }

      // 동일 학년도 내 모든 기준 날짜 탭의 해당 학년에 사전데이터 완전 동기화
      const currAY = MultiState.activeAcademicYear || '2027학년도';
      const dateList = (MultiState.datesByAcademicYear && MultiState.datesByAcademicYear[currAY]) || MultiState.yearsList || [];
      dateList.forEach(d => {
        if (!curAcadData[d]) curAcadData[d] = {};
        if (!curAcadData[d][activeG]) curAcadData[d][activeG] = createEmptyGradeState(activeG);
        curAcadData[d][activeG].priorData = JSON.parse(JSON.stringify(priorDataObj));
        if (activeG === '2학년') {
          if (!curAcadData[d]['1학년']) curAcadData[d]['1학년'] = createEmptyGradeState('1학년');
          curAcadData[d]['1학년'].priorData = JSON.parse(JSON.stringify(priorDataObj));
        }
      });

      updatePriorDataUI();
      if (AppState.students && AppState.students.length > 0) {
        renderStep1TableOnly();
      }
      saveAllState();

      let msg = `✅ [${activeG}] 사전 데이터가 등록되었습니다!\n\n` +
        `• 등록 파일: ${fileNames.join(', ')}\n` +
        `• 총 학생: ${finalStudentList.length}명 (${classSummaryStr})`;
      if (activeG === '3학년') {
        msg += `\n• 누적 이수 기록: ${totalRecords}건 (1학기 ${s1Records}건, 2학기 ${s2Records}건)`;
      } else {
        msg += `\n• 1학년 공통과목 학생 명부 등록 완료`;
      }
      alert(msg);
    }

    function clearPriorData(targetSemester = null) {
      const activeG = MultiState.activeGrade || '2학년';
      const activeY = MultiState.activeYear || '2027';
      const currAY = MultiState.activeAcademicYear || '2027학년도';
      const curAcadData = getAcadData();
      const dateList = (MultiState.datesByAcademicYear && MultiState.datesByAcademicYear[currAY]) || MultiState.yearsList || [];

      dateList.forEach(d => {
        if (curAcadData[d] && curAcadData[d][activeG]) {
          curAcadData[d][activeG].priorData = null;
          curAcadData[d][activeG].crossCheckResult = { missingStudents: [], duplicateEnrollments: [] };
          if (activeG === '2학년' && curAcadData[d]['1학년']) {
            curAcadData[d]['1학년'].priorData = null;
          }
        }
      });

      AppState.priorData = null;
      AppState.crossCheckResult = { missingStudents: [], duplicateEnrollments: [] };

      const pFileInput = document.getElementById('priorFileInput');
      if (pFileInput) pFileInput.value = '';

      updatePriorDataUI();

      if (AppState.students && AppState.students.length > 0) {
        renderStep1TableOnly();
      }
      saveAllState();
      alert(`🗑️ [${activeG}]의 사전 데이터가 삭제되었습니다.`);
    }

    function loadSamplePriorData(showAlert = true) {
      const activeG = MultiState.activeGrade || '2학년';
      const activeY = MultiState.activeYear || '2027';
      const sampleList = [
        { c: '1', n: '1', name: '학생01', s1: ['공통국어1(3)', '공통수학1(3)'], s2: ['물리학(3)'] },
        { c: '1', n: '2', name: '학생02', s1: ['공통영어1(3)'], s2: ['미디어 영어(3)'] },
        { c: '1', n: '3', name: '학생03', s1: ['공통국어1(3)'], s2: ['한국사1(3)'] },
        { c: '2', n: '1', name: '학생04', s1: ['공통국어1(3)'], s2: ['공통수학1(3)'] },
        { c: '2', n: '2', name: '학생05', s1: ['공통국어1(3)'], s2: ['통합사회1(3)'] },
        { c: '2', n: '3', name: '학생06', s1: ['공통국어1(3)'], s2: ['통합과학1(3)'] },
        { c: '2', n: '4', name: '학생07', s1: ['공통국어1(3)'], s2: ['공통영어1(3)'] },
        { c: '1', n: '4', name: '학생08', s1: ['공통국어1(3)'], s2: ['한국사1(3)'] },
        { c: '1', n: '5', name: '학생09', s1: ['공통수학1(3)'], s2: ['기술가정(2)'] },
        { c: '1', n: '6', name: '학생10', s1: ['공통영어1(3)'], s2: ['정보(2)'] },
        { c: '1', n: '7', name: '학생11', s1: ['공통국어1(3)'], s2: ['공통수학1(3)'] },
        { c: '2', n: '5', name: '학생12', s1: ['공통국어1(3)'], s2: ['공통영어1(3)'] }
      ];

      let sem1Records = 0;
      let sem2Records = 0;
      const studentList = sampleList.map(st => {
        const courseDetails = [];
        (st.s1 || []).forEach(subj => {
          sem1Records++;
          const cleanSubj = getBaseSubjectName(subj);
          courseDetails.push({
            subject: cleanSubj || subj,
            rawSubject: subj,
            normSubject: normalizeSubject(subj),
            credit: 3,
            semester: 1,
            uploadSem: 1,
            grade: activeG === '3학년' ? '2학년' : '1학년'
          });
        });
        (st.s2 || []).forEach(subj => {
          sem2Records++;
          const cleanSubj = getBaseSubjectName(subj);
          courseDetails.push({
            subject: cleanSubj || subj,
            rawSubject: subj,
            normSubject: normalizeSubject(subj),
            credit: 3,
            semester: 2,
            uploadSem: 2,
            grade: activeG === '3학년' ? '2학년' : '1학년'
          });
        });
        return {
          key: `${st.c}_${st.n}_${st.name}`,
          grade: activeG,
          classNum: st.c,
          studentNum: st.n,
          name: st.name,
          courseDetails
        };
      });

      AppState.priorData = rebuildPriorDataFromStudents(studentList, {
        sem1FileName: `${activeG}_1학기_사전데이터(샘플).xlsx`,
        sem1StudentCount: studentList.length,
        sem1RecordCount: sem1Records,
        sem2FileName: `${activeG}_2학기_사전데이터(샘플).xlsx`,
        sem2StudentCount: studentList.length,
        sem2RecordCount: sem2Records
      });

      const curAcadData = getAcadData();
      if (!curAcadData[activeY]) curAcadData[activeY] = {};
      if (!curAcadData[activeY][activeG]) curAcadData[activeY][activeG] = createEmptyGradeState(activeG);
      curAcadData[activeY][activeG].priorData = AppState.priorData;

      updatePriorDataUI();

      if (AppState.students && AppState.students.length > 0) {
        runCrossCheckAnalysis();
        renderStep1TableOnly();
      }

      saveAllState();

      if (showAlert) {
        alert(`💡 [${activeG}] 1·2학기 샘플 사전 데이터(12명, 과목 기록 ${sem1Records + sem2Records}건)가 등록되었습니다!\n미신청 학생 2명과 기이수 중복신청 학생 2명이 자동 감지됩니다.`);
      }
    }

    function runCrossCheckAnalysis() {
      if (!AppState.students || AppState.students.length === 0) {
        crossCheckAlertPanel?.classList.add('hidden');
        return;
      }

      const hasPrior = !!(AppState.priorData && AppState.priorData.students && AppState.priorData.students.length > 0);
      const targetGrade = MultiState.activeGrade || AppState.detectedGrade || '2학년';
      const targetGradeNum = targetGrade.replace(/[^0-9]/g, '');

      // 1. Missing Students Analysis (사전 명부에는 있으나 수강신청 하지 않은 학생)
      const missing = [];
      if (hasPrior) {
        const relevantPrior = AppState.priorData.students || [];
        relevantPrior.forEach(priorSt => {
          const match = AppState.students.find(st => {
            const cMatch = String(st.classNum).replace(/[^0-9]/g, '') === priorSt.classNum;
            const nMatch = String(st.studentNum).replace(/[^0-9]/g, '') === priorSt.studentNum;
            const nameMatch = st.name.trim() === priorSt.name.trim();
            return (cMatch && nMatch && nameMatch) || (cMatch && nameMatch);
          });

          if (!match) {
            missing.push({
              grade: priorSt.grade || targetGrade,
              classNum: priorSt.classNum,
              studentNum: priorSt.studentNum,
              name: priorSt.name
            });
          }
        });

        missing.sort((a, b) => {
          const cDiff = (parseInt(a.classNum, 10) || 0) - (parseInt(b.classNum, 10) || 0);
          if (cDiff !== 0) return cDiff;
          return (parseInt(a.studentNum, 10) || 0) - (parseInt(b.studentNum, 10) || 0);
        });
      }

      // 2. Duplicate Enrollments Analysis (동일 과목 및 기이수 과목 중복 수강 신청 탐지)
      //    - 현재 학년 내 중복 (1학기 vs 2학기 동일 과목 중복 선택, 또는 동일 학기 내 중복)
      //    - 이전 학년 기이수 과목과 중복 (사전 명부 기이수 과목 대조)
      const duplicates = [];

      AppState.students.forEach(st => {
        const cNum = String(st.classNum).replace(/[^0-9]/g, '');
        const sNum = String(st.studentNum).replace(/[^0-9]/g, '');
        const sName = st.name.trim();
        const stGradeNum = (st.grade ? String(st.grade).replace(/[^0-9]/g, '') : '') || targetGradeNum || '2';

        const dupList = [];
        const seenNormsThisStudent = new Set();

        // ---------------------------------------------------------
        // A. 현재 학년 내 중복 확인 (1학기 vs 2학기 동일 과목, 동일 학기 내 중복)
        // ---------------------------------------------------------
        const sem1Norms = (st.sem1 || []).map(s => ({ raw: s, norm: normalizeSubject(s) })).filter(x => x.norm);
        const sem2Norms = (st.sem2 || []).map(s => ({ raw: s, norm: normalizeSubject(s) })).filter(x => x.norm);

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
              gradeNum: stGradeNum,
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
              gradeNum: stGradeNum,
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
                gradeNum: stGradeNum,
                semester: 1,
                sourceType: 'current_cross_sem',
                sourceLabel: `현재 학년 1·2학기 중복`
              });
              dupList.push({
                subject: inSem2.raw,
                normalized: norm1,
                gradeNum: stGradeNum,
                semester: 2,
                sourceType: 'current_cross_sem',
                sourceLabel: `현재 학년 1·2학기 중복`
              });
            }
          }
        });

        // ---------------------------------------------------------
        // B. 이전 학년 기이수 과목과 중복 대조 (사전 등록된 NEIS 명부)
        // ---------------------------------------------------------
        if (hasPrior) {
          const priorSt = AppState.priorData.students.find(p => {
            const cMatch = p.classNum === cNum;
            const nMatch = p.studentNum === sNum;
            const nameMatch = p.name.trim() === sName;
            return (cMatch && nMatch && nameMatch) || (cMatch && nameMatch);
          });

          if (priorSt) {
            const priorHas = (subj) => {
              const norm = normalizeSubject(subj);
              if (!norm) return false;
              if (Array.isArray(priorSt.subjects)) {
                return priorSt.subjects.includes(norm);
              }
              if (priorSt.subjects && typeof priorSt.subjects.has === 'function') {
                return priorSt.subjects.has(norm);
              }
              return false;
            };

            (st.sem1 || []).forEach(subj => {
              if (priorHas(subj)) {
                const norm = normalizeSubject(subj);
                const dupKey = `prior_1_${norm}`;
                if (!seenNormsThisStudent.has(dupKey)) {
                  seenNormsThisStudent.add(dupKey);
                  dupList.push({
                    subject: subj,
                    normalized: norm,
                    gradeNum: stGradeNum,
                    semester: 1,
                    sourceType: 'prior_grade',
                    sourceLabel: `이전 학년 기이수 중복`
                  });
                }
              }
            });

            (st.sem2 || []).forEach(subj => {
              if (priorHas(subj)) {
                const norm = normalizeSubject(subj);
                const dupKey = `prior_2_${norm}`;
                if (!seenNormsThisStudent.has(dupKey)) {
                  seenNormsThisStudent.add(dupKey);
                  dupList.push({
                    subject: subj,
                    normalized: norm,
                    gradeNum: stGradeNum,
                    semester: 2,
                    sourceType: 'prior_grade',
                    sourceLabel: `이전 학년 기이수 중복`
                  });
                }
              }
            });
          }
        }

        if (dupList.length > 0) {
          const summaryParts = [];
          const groupedByNorm = {};
          dupList.forEach(d => {
            if (!groupedByNorm[d.normalized]) {
              groupedByNorm[d.normalized] = {
                subject: d.subject,
                labels: new Set()
              };
            }
            groupedByNorm[d.normalized].labels.add(d.sourceLabel);
          });

          Object.values(groupedByNorm).forEach(g => {
            summaryParts.push(`${g.subject} (${Array.from(g.labels).join(', ')})`);
          });

          duplicates.push({
            grade: targetGrade,
            classNum: st.classNum,
            studentNum: st.studentNum,
            name: st.name,
            dupList: dupList,
            dupSubjStr: summaryParts.join(' / ')
          });
        }
      });

      duplicates.sort((a, b) => {
        const cDiff = (parseInt(a.classNum, 10) || 0) - (parseInt(b.classNum, 10) || 0);
        if (cDiff !== 0) return cDiff;
        return (parseInt(a.studentNum, 10) || 0) - (parseInt(b.studentNum, 10) || 0);
      });

      AppState.crossCheckResult = {
        missingStudents: missing,
        duplicateEnrollments: duplicates
      };

      renderCrossCheckResults();
    }

    function renderCrossCheckResults() {
      if (!AppState.crossCheckResult) return;
      const { missingStudents, duplicateEnrollments } = AppState.crossCheckResult;
      const hasPrior = !!(AppState.priorData && AppState.priorData.students && AppState.priorData.students.length > 0);

      if (!hasPrior && duplicateEnrollments.length === 0) {
        crossCheckAlertPanel?.classList.add('hidden');
        return;
      }

      crossCheckAlertPanel?.classList.remove('hidden');

      if (missingCountDisplay) {
        missingCountDisplay.textContent = hasPrior ? `${missingStudents.length}명` : '사전 명부 미등록';
      }
      if (duplicateCountDisplay) duplicateCountDisplay.textContent = `${duplicateEnrollments.length}명`;
      if (missingBadgeCount) {
        missingBadgeCount.textContent = hasPrior ? `${missingStudents.length}명` : '미등록';
      }
      if (duplicateBadgeCount) duplicateBadgeCount.textContent = `${duplicateEnrollments.length}명`;

      // Render Missing Students Table
      if (missingStudentsTbody) {
        if (!hasPrior) {
          missingStudentsTbody.innerHTML = `
            <tr>
              <td colspan="6" class="p-4 text-center text-slate-400 font-medium bg-slate-50/50">
                ℹ️ 상단의 [사전 데이터 등록] 카드에서 이전 학년 NEIS 명부를 등록하면 미신청자를 자동 대조합니다.
              </td>
            </tr>
          `;
        } else if (missingStudents.length === 0) {
          missingStudentsTbody.innerHTML = `
            <tr>
              <td colspan="6" class="p-4 text-center text-emerald-600 font-bold bg-emerald-50/40">
                ✅ 사전 명부의 모든 학생이 수강신청을 완료했습니다! (미신청자 0명)
              </td>
            </tr>
          `;
        } else {
          missingStudentsTbody.innerHTML = missingStudents.map((st, idx) => `
            <tr class="hover:bg-rose-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}">
              <td class="p-2 border-r border-slate-200 font-medium text-slate-500">${idx + 1}</td>
              <td class="p-2 border-r border-slate-200 font-medium">${st.grade}</td>
              <td class="p-2 border-r border-slate-200 font-medium">${st.classNum}반</td>
              <td class="p-2 border-r border-slate-200 font-medium">${st.studentNum}번</td>
              <td class="p-2 border-r border-slate-200 font-bold text-slate-900">${st.name}</td>
              <td class="p-2 font-bold text-rose-600 bg-rose-50/70">
                <div class="flex items-center justify-center gap-1.5">
                  <span>미신청</span>
                  <button type="button" onclick="window.openAddStudentModalWithPreset('${st.classNum}', '${st.studentNum}', '${st.name.replace(/'/g, "\\'")}')" class="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold shadow-2xs transition cursor-pointer" title="이 미신청 학생을 명단에 추가하고 선택과목을 입력합니다">+ 추가</button>
                </div>
              </td>
            </tr>
          `).join('');
        }
      }

      // Render Duplicate Courses Table
      if (duplicateStudentsTbody) {
        if (duplicateEnrollments.length === 0) {
          duplicateStudentsTbody.innerHTML = `
            <tr>
              <td colspan="6" class="p-4 text-center text-emerald-600 font-bold bg-emerald-50/40">
                ✅ 동일 과목(1·2학기) 및 이전 학년 기이수 과목과 중복된 수강 신청 내역이 없습니다! (중복 신청 0건)
              </td>
            </tr>
          `;
        } else {
          duplicateStudentsTbody.innerHTML = duplicateEnrollments.map((st, idx) => {
            const badgesHtml = st.dupList.map(d => {
              const isPrior = d.sourceType === 'prior_grade';
              const badgeStyle = isPrior
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-amber-100 text-amber-900 border-amber-300';
              return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${badgeStyle} mr-1 mb-0.5" title="${d.sourceLabel}">
                ${d.subject} (${d.semester}학기 / ${d.sourceLabel})
              </span>`;
            }).filter((v, i, a) => a.indexOf(v) === i).join('');

            return `
              <tr class="hover:bg-amber-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}">
                <td class="p-2 border-r border-slate-200 font-medium text-slate-500">${idx + 1}</td>
                <td class="p-2 border-r border-slate-200 font-medium">${st.grade}</td>
                <td class="p-2 border-r border-slate-200 font-medium">${st.classNum}반</td>
                <td class="p-2 border-r border-slate-200 font-medium">${st.studentNum}번</td>
                <td class="p-2 border-r border-slate-200 font-bold text-slate-900">${st.name}</td>
                <td class="p-2 text-left font-bold text-amber-900 bg-amber-50/70">
                  <div class="flex flex-wrap items-center">
                    ${badgesHtml}
                  </div>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
    }

    function exportCrossCheckExcel() {
      if (!AppState.crossCheckResult) {
        alert('대조 검증 데이터가 없습니다.');
        return;
      }
      const { missingStudents, duplicateEnrollments } = AppState.crossCheckResult;
      const wb = XLSX.utils.book_new();
      const rawGrade = AppState.detectedGrade || '1학년';
      const grade = rawGrade.includes('학년') ? rawGrade : `${rawGrade}학년`;

      const fontKo = '맑은 고딕';
      const pastelBorder = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };
      const pastelBorderThick = {
        top: { style: 'medium', color: { rgb: '94A3B8' } },
        bottom: { style: 'medium', color: { rgb: '94A3B8' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      const setCellStyle = (ws, r, c, style) => {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!ws[ref]) ws[ref] = { t: 's', v: '' };
        ws[ref].s = style;
      };

      const setRangeStyle = (ws, startR, startC, endR, endC, style) => {
        for (let r = startR; r <= endR; r++) {
          for (let c = startC; c <= endC; c++) {
            setCellStyle(ws, r, c, style);
          }
        }
      };

      const makeRowHeights = (dataLen) => {
        const r = [
          { hpt: 30 }, // Row 0 Title
          { hpt: 18 }, // Row 1 Subtitle
          { hpt: 8 },  // Row 2 Gap
          { hpt: 25 }, // Row 3 Header
        ];
        for (let i = 0; i < dataLen; i++) {
          r.push({ hpt: 22 });
        }
        r.push({ hpt: 8 });  // Gap
        r.push({ hpt: 24 }); // Total
        return r;
      };

      // Sheet 1: 미신청자 명단
      const missRows = [
        [`${grade} 수강신청 미신청 학생 명단`],
        [`출력일시: ${new Date().toLocaleString()} | 미신청 학생 총: ${missingStudents.length}명 | 사전 등록 학생 명부 기준`],
        [],
        ['연번', '학년', '반', '번호', '성명', '신청 상태']
      ];
      missingStudents.forEach((st, idx) => {
        missRows.push([idx + 1, st.grade, `${st.classNum}반`, `${st.studentNum}번`, st.name, '미신청']);
      });
      missRows.push([]);
      missRows.push(['합계', '', '', '', '', `미신청 학생 총 ${missingStudents.length}명`]);

      const wsMiss = XLSX.utils.aoa_to_sheet(missRows);
      wsMiss['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }
      ];
      wsMiss['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 16 }];
      wsMiss['!rows'] = makeRowHeights(missingStudents.length);

      // Sheet 1 파스텔 스타일 적용 (부드러운 소프트 블루 & 로즈)
      const missTitleStyle = {
        font: { name: fontKo, sz: 14, bold: true, color: { rgb: '1E3A8A' } },
        fill: { fgColor: { rgb: 'DBEAFE' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: pastelBorder
      };
      const missSubStyle = {
        font: { name: fontKo, sz: 9.5, color: { rgb: '475569' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: pastelBorder
      };
      setRangeStyle(wsMiss, 0, 0, 0, 5, missTitleStyle);
      setRangeStyle(wsMiss, 1, 0, 1, 5, missSubStyle);

      for (let c = 0; c < 6; c++) {
        const isStatusCol = (c === 5);
        setCellStyle(wsMiss, 3, c, {
          font: { name: fontKo, sz: 10.5, bold: true, color: { rgb: isStatusCol ? '991B1B' : '1E40AF' } },
          fill: { fgColor: { rgb: isStatusCol ? 'FEE2E2' : 'E0E7FF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorderThick
        });
      }

      missingStudents.forEach((_, idx) => {
        const r = 4 + idx;
        const isEven = idx % 2 === 1;
        const bg = isEven ? 'F8FAFC' : 'FFFFFF';
        setCellStyle(wsMiss, r, 0, {
          font: { name: fontKo, sz: 9.5, color: { rgb: '64748B' } },
          fill: { fgColor: { rgb: bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorder
        });
        setCellStyle(wsMiss, r, 1, {
          font: { name: fontKo, sz: 10, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorder
        });
        setCellStyle(wsMiss, r, 2, {
          font: { name: fontKo, sz: 10, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorder
        });
        setCellStyle(wsMiss, r, 3, {
          font: { name: fontKo, sz: 10, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorder
        });
        setCellStyle(wsMiss, r, 4, {
          font: { name: fontKo, sz: 10.5, bold: true, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorder
        });
        setCellStyle(wsMiss, r, 5, {
          font: { name: fontKo, sz: 10, bold: true, color: { rgb: 'DC2626' } },
          fill: { fgColor: { rgb: 'FFF1F2' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: 'FECDD3' } },
            bottom: { style: 'thin', color: { rgb: 'FECDD3' } },
            left: { style: 'thin', color: { rgb: 'FECDD3' } },
            right: { style: 'thin', color: { rgb: 'FECDD3' } }
          }
        });
      });

      const missSumR = 4 + missingStudents.length + 1;
      for (let c = 0; c < 6; c++) {
        setCellStyle(wsMiss, missSumR, c, {
          font: { name: fontKo, sz: 10, bold: true, color: { rgb: '1E293B' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: (c === 5 ? 'right' : 'center'), vertical: 'center' },
          border: pastelBorderThick
        });
      }
      XLSX.utils.book_append_sheet(wb, wsMiss, '수강신청_미신청자_명단');

      // Sheet 2: 중복 신청 의심자 명단
      const dupRows = [
        [`${grade} 수강신청 중복 신청 학생 명단`],
        [`출력일시: ${new Date().toLocaleString()} | 중복 신청 의심 학생 총: ${duplicateEnrollments.length}명 | 기이수 및 학년 내 중복 대조 기준`],
        [],
        ['연번', '학년', '반', '번호', '성명', '중복 신청된 과목 및 사유']
      ];
      duplicateEnrollments.forEach((st, idx) => {
        dupRows.push([idx + 1, st.grade, `${st.classNum}반`, `${st.studentNum}번`, st.name, st.dupSubjStr]);
      });
      dupRows.push([]);
      dupRows.push(['합계', '', '', '', '', `중복 신청 의심 학생 총 ${duplicateEnrollments.length}명`]);

      const wsDup = XLSX.utils.aoa_to_sheet(dupRows);
      wsDup['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }
      ];
      wsDup['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 45 }];
      wsDup['!rows'] = makeRowHeights(duplicateEnrollments.length);

      // Sheet 2 파스텔 스타일 적용 (부드러운 피치/앰버)
      const dupTitleStyle = {
        font: { name: fontKo, sz: 14, bold: true, color: { rgb: '78350F' } },
        fill: { fgColor: { rgb: 'FEF3C7' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: pastelBorder
      };
      const dupSubStyle = {
        font: { name: fontKo, sz: 9.5, color: { rgb: '92400E' } },
        fill: { fgColor: { rgb: 'FFFBEB' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: pastelBorder
      };
      setRangeStyle(wsDup, 0, 0, 0, 5, dupTitleStyle);
      setRangeStyle(wsDup, 1, 0, 1, 5, dupSubStyle);

      for (let c = 0; c < 6; c++) {
        const isDetailCol = (c === 5);
        setCellStyle(wsDup, 3, c, {
          font: { name: fontKo, sz: 10.5, bold: true, color: { rgb: isDetailCol ? '9A3412' : '92400E' } },
          fill: { fgColor: { rgb: isDetailCol ? 'FFEDD5' : 'FEF3C7' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorderThick
        });
      }

      duplicateEnrollments.forEach((_, idx) => {
        const r = 4 + idx;
        const isEven = idx % 2 === 1;
        const bg = isEven ? 'FFFDF7' : 'FFFFFF';
        setCellStyle(wsDup, r, 0, {
          font: { name: fontKo, sz: 9.5, color: { rgb: '64748B' } },
          fill: { fgColor: { rgb: bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorder
        });
        setCellStyle(wsDup, r, 1, {
          font: { name: fontKo, sz: 10, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorder
        });
        setCellStyle(wsDup, r, 2, {
          font: { name: fontKo, sz: 10, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorder
        });
        setCellStyle(wsDup, r, 3, {
          font: { name: fontKo, sz: 10, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorder
        });
        setCellStyle(wsDup, r, 4, {
          font: { name: fontKo, sz: 10.5, bold: true, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: bg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: pastelBorder
        });
        setCellStyle(wsDup, r, 5, {
          font: { name: fontKo, sz: 9.5, color: { rgb: 'C2410C' } },
          fill: { fgColor: { rgb: isEven ? 'FFFBF5' : 'FFF7ED' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'FED7AA' } },
            bottom: { style: 'thin', color: { rgb: 'FED7AA' } },
            left: { style: 'thin', color: { rgb: 'FED7AA' } },
            right: { style: 'thin', color: { rgb: 'FED7AA' } }
          }
        });
      });

      const dupSumR = 4 + duplicateEnrollments.length + 1;
      for (let c = 0; c < 6; c++) {
        setCellStyle(wsDup, dupSumR, c, {
          font: { name: fontKo, sz: 10, bold: true, color: { rgb: '78350F' } },
          fill: { fgColor: { rgb: 'FEF3C7' } },
          alignment: { horizontal: (c === 5 ? 'right' : 'center'), vertical: 'center' },
          border: pastelBorderThick
        });
      }
      XLSX.utils.book_append_sheet(wb, wsDup, '동일_기이수_중복신청_명단');

      // 파일명: 수강신청 미신청자 및 중복 신청자 명단_날짜_시간(N학년)
      const outName = buildExportFileName(`수강신청 미신청자 및 중복 신청자 명단(${grade})`, "xlsx");
      window.saveExcelFile(wb, outName);
    }

    // 학생 배부용 중복신청 과목 변경 확인 및 신청서 엑셀 다운로드 (출력용 공적 문서 양식)
    window.exportDuplicateCorrectionExcel = function() {
      if (!AppState.crossCheckResult || !AppState.crossCheckResult.duplicateEnrollments || AppState.crossCheckResult.duplicateEnrollments.length === 0) {
        alert('현재 동일·기이수 중복 신청 의심 학생이 없습니다.');
        return;
      }
      const duplicateEnrollments = AppState.crossCheckResult.duplicateEnrollments;
      const wb = XLSX.utils.book_new();
      const grade = AppState.detectedGrade || '2학년';
      const activeYear = MultiState?.activeYear || '2027';

      // 1. 헤더 및 타이틀 구성
      const rows = [
        [`[상지대관령고등학교] ${activeYear}학년도 ${grade} 동일·기이수 과목 중복신청 과목 변경 확인 및 신청서`],
        [`발행일자: ${new Date().toLocaleDateString('ko-KR')} | 대상 학생: 총 ${duplicateEnrollments.length}명 | 상지대관령고등학교 교육과정위원회`],
        [`※ 학생 안내사항: 본 학생은 동일 학년 내 중복 선택 또는 이전 학년 기이수 과목과 중복되었습니다. 아래 내역을 확인한 후 '변경 희망 과목명' 및 '확인 서명'을 기재하여 교육과정 담당 선생님께 제출하시기 바랍니다.`],
        ['연번', '학적 (반-번호)', '성명', '학기', '현재 중복 신청 과목', '중복 사유 / 구분', '변경 희망 과목명 (수기 작성란)', '학생 확인', '보호자 확인']
      ];

      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }
      ];

      const studentSpanMeta = [];

      let curRowIdx = 4;
      duplicateEnrollments.forEach((st, sIdx) => {
        const dupList = (st.dupList && st.dupList.length > 0) 
          ? st.dupList 
          : [{ semester: 1, subject: st.dupSubjStr || '중복과목', sourceLabel: '중복 의심' }];
        const startR = curRowIdx;
        const endR = curRowIdx + dupList.length - 1;

        dupList.forEach((d) => {
          rows.push([
            sIdx + 1,
            `${st.grade} ${st.classNum}반 ${st.studentNum}번`,
            st.name,
            `${d.semester}학기`,
            d.subject,
            d.sourceLabel || '동일/기이수 중복',
            '', // 학생이 직접 손으로 작성할 변경 희망 과목명 빈칸
            '(서명)',
            '(서명)'
          ]);
          curRowIdx++;
        });

        // 학생별 중복 과목이 복수개일 경우 학생 기본 정보 및 서명란 병합
        if (dupList.length > 1) {
          merges.push({ s: { r: startR, c: 0 }, e: { r: endR, c: 0 } }); // 연번
          merges.push({ s: { r: startR, c: 1 }, e: { r: endR, c: 1 } }); // 학적
          merges.push({ s: { r: startR, c: 2 }, e: { r: endR, c: 2 } }); // 성명
          merges.push({ s: { r: startR, c: 7 }, e: { r: endR, c: 7 } }); // 학생 서명
          merges.push({ s: { r: startR, c: 8 }, e: { r: endR, c: 8 } }); // 보호자 서명
        }

        studentSpanMeta.push({ sIdx, startR, endR });
      });

      // 하단 확인 및 서약 문구
      const bottomNoticeR = curRowIdx;
      rows.push([]);
      rows.push(['위 학생의 수강신청 변경 사항을 확인하였으며, 상기와 같이 과목 변경을 신청합니다.']);
      rows.push([`202   년     월     일        신청 학생:                    (인/서명)        담임 교사 확인:                    (인/서명)`]);
      merges.push({ s: { r: bottomNoticeR + 1, c: 0 }, e: { r: bottomNoticeR + 1, c: 8 } });
      merges.push({ s: { r: bottomNoticeR + 2, c: 0 }, e: { r: bottomNoticeR + 2, c: 8 } });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!merges'] = merges;
      ws['!cols'] = [
        { wch: 6 },  // 연번
        { wch: 16 }, // 학적
        { wch: 12 }, // 성명
        { wch: 9 },  // 학기
        { wch: 22 }, // 현재 중복 과목
        { wch: 24 }, // 중복 사유
        { wch: 34 }, // 변경 희망 과목명 (수기 작성란)
        { wch: 12 }, // 학생 확인
        { wch: 12 }  // 보호자 확인
      ];

      // A4 가로 인쇄 최적화 설정
      ws['!pageSetup'] = {
        paperSize: 9,            // A4
        orientation: 'landscape', // 가로 방향
        fitToWidth: 1,
        fitToPage: true
      };
      ws['!printOptions'] = { horizontalCentered: true };
      ws['!margins'] = { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 };

      // 공적 문서 스타일 적용
      ExcelStyler.setRange(ws, 0, 0, 0, 8, ExcelStyler.titleStyle(true));
      ExcelStyler.setRange(ws, 1, 0, 1, 8, ExcelStyler.subtitleStyle(true));
      ExcelStyler.setRange(ws, 2, 0, 2, 8, {
        font: { name: '맑은 고딕', sz: 9.5, italic: true, color: { rgb: '92400E' } },
        fill: { fgColor: { rgb: 'FEF3C7' } },
        alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
        border: ExcelStyler.cellBorders(true, true, true, true, false, false, false, false)
      });

      // 테이블 헤더
      for (let c = 0; c < 9; c++) {
        ExcelStyler.setCell(ws, 3, c, ExcelStyler.headerStyle('B45309', c === 8, c === 0));
      }

      // 데이터 행 스타일링
      studentSpanMeta.forEach(({ sIdx, startR, endR }) => {
        const isEven = sIdx % 2 === 1;
        for (let r = startR; r <= endR; r++) {
          ExcelStyler.setCell(ws, r, 0, ExcelStyler.dataCenter(isEven, false, true));
          ExcelStyler.setCell(ws, r, 1, ExcelStyler.dataCenter(isEven, false, false));
          ExcelStyler.setCell(ws, r, 2, ExcelStyler.dataBold(isEven, false, false));
          ExcelStyler.setCell(ws, r, 3, ExcelStyler.dataCenter(isEven, false, false));
          ExcelStyler.setCell(ws, r, 4, ExcelStyler.dataWarning(false, false));
          ExcelStyler.setCell(ws, r, 5, ExcelStyler.dataText(isEven, false, false));
          // 변경 희망 과목명 칸: 넉넉하고 깔끔한 수기 작성용 빈 칸 스타일
          ExcelStyler.setCell(ws, r, 6, {
            font: { name: '맑은 고딕', sz: 10, color: { rgb: '1E293B' } },
            fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
            alignment: { vertical: 'center', horizontal: 'center' },
            border: ExcelStyler.cellBorders(true, true, true, true, false, false, false, false)
          });
          ExcelStyler.setCell(ws, r, 7, ExcelStyler.dataCenter(isEven, false, false));
          ExcelStyler.setCell(ws, r, 8, ExcelStyler.dataCenter(isEven, true, false));
        }
      });

      // 하단 확인 서명 안내 스타일링
      ExcelStyler.setRange(ws, bottomNoticeR + 1, 0, bottomNoticeR + 1, 8, {
        font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: '334155' } },
        alignment: { vertical: 'center', horizontal: 'center' },
        border: ExcelStyler.cellBorders(false, false, false, false, false, false, false, false)
      });
      ExcelStyler.setRange(ws, bottomNoticeR + 2, 0, bottomNoticeR + 2, 8, {
        font: { name: '맑은 고딕', sz: 10, bold: true, color: { rgb: '1E293B' } },
        alignment: { vertical: 'center', horizontal: 'center' },
        border: ExcelStyler.cellBorders(false, false, false, false, false, false, false, false)
      });

      XLSX.utils.book_append_sheet(wb, ws, '중복과목_변경신청서');
      const filename = buildExportFileName(`${grade} 중복신청 과목변경 신청서(학생배부용)`, "xlsx");
      window.saveExcelFile(wb, filename);
    };

    // Prior Data Event Listeners (통합 등록 및 다중 파일 지원)
    if (priorFileInput) {
      priorFileInput.addEventListener('click', () => {
        priorFileInput.value = '';
      });
      priorFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          processPriorDataFiles(e.target.files);
        }
      });
      priorFileInput.addEventListener('dragenter', (e) => {
        e.preventDefault();
        priorDropZone?.classList.add('border-indigo-600', 'bg-indigo-100/60', 'ring-4', 'ring-indigo-100');
      });
      priorFileInput.addEventListener('dragover', (e) => {
        e.preventDefault();
        priorDropZone?.classList.add('border-indigo-600', 'bg-indigo-100/60', 'ring-4', 'ring-indigo-100');
      });
      priorFileInput.addEventListener('dragleave', (e) => {
        e.preventDefault();
        priorDropZone?.classList.remove('border-indigo-600', 'bg-indigo-100/60', 'ring-4', 'ring-indigo-100');
      });
      priorFileInput.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        priorDropZone?.classList.remove('border-indigo-600', 'bg-indigo-100/60', 'ring-4', 'ring-indigo-100');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processPriorDataFiles(e.dataTransfer.files);
        }
      });
    }

    btnClearPrior?.addEventListener('click', () => {
      if (confirm(`현재 [${MultiState.activeGrade}]의 사전 데이터를 모두 삭제하시겠습니까?`)) {
        clearPriorData();
      }
    });

    btnToggleCrossCheckDetails?.addEventListener('click', () => {
      const isHidden = crossCheckDetailsContainer?.classList.contains('hidden');
      if (isHidden) {
        crossCheckDetailsContainer?.classList.remove('hidden');
        if (crossCheckToggleText) crossCheckToggleText.textContent = '명단 상세 접기 ▲';
      } else {
        crossCheckDetailsContainer?.classList.add('hidden');
        if (crossCheckToggleText) crossCheckToggleText.textContent = '명단 상세 펼치기 ▼';
      }
    });

    btnExportCrossCheckExcel?.addEventListener('click', () => {
      exportCrossCheckExcel();
    });

    // ==========================================
    // 1. FILE UPLOAD & RE-LOAD HANDLERS
    // ==========================================

    // Clear input on click so selecting the same file triggers change event
    fileInput.addEventListener('click', () => {
      fileInput.value = '';
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processUploadedFile(e.target.files[0]);
      }
    });

    // Native Drag & Drop UI effects on fileInput
    fileInput.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-600', 'bg-blue-100/60', 'ring-4', 'ring-blue-100');
    });

    fileInput.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-600', 'bg-blue-100/60', 'ring-4', 'ring-blue-100');
    });

    fileInput.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-600', 'bg-blue-100/60', 'ring-4', 'ring-blue-100');
    });

    fileInput.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-blue-600', 'bg-blue-100/60', 'ring-4', 'ring-blue-100');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processUploadedFile(e.dataTransfer.files[0]);
      }
    });

    document.getElementById('btnClearSurvey')?.addEventListener('click', () => {
      if (confirm(`현재 [${MultiState.activeGrade}]의 수강신청 조사 데이터를 삭제하시겠습니까?\n(등록된 사전 데이터는 그대로 유지됩니다.)`)) {
        clearSurveyData();
      }
    });

    // Prevent default browser file drag navigation across the whole window
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());

    function processUploadedFile(file) {
      if (!file) return;
      if (file.name.toLowerCase().endsWith('.json')) {
        window.importBackupJsonFile(file);
        return;
      }
      if (typeof XLSX === 'undefined') {
        alert('엑셀 처리 라이브러리를 준비 중입니다. 1~2초 후 다시 시도해주세요.');
        return;
      }

      showLoading(`[${file.name}] 파일 분석 중...`);
      AppState.fileName = file.name;
      detectGradeFromFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        // Small delay to allow loading spinner to render
        setTimeout(() => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            parseWorkbook(workbook, file.name);
          } catch (err) {
            console.error(err);
            alert('엑셀 파일을 읽는 도중 오류가 발생했습니다: ' + err.message);
          } finally {
            hideLoading();
            fileInput.value = ''; // Always reset so re-selecting same file works
          }
        }, 60);
      };

      reader.onerror = () => {
        hideLoading();
        alert('파일을 읽어오는 데 실패했습니다.');
        fileInput.value = '';
      };

      reader.readAsArrayBuffer(file);
    }

    function detectGradeFromFileName(name) {
      // 사용자가 현재 작업 중인 탭 학년(MultiState.activeGrade)을 절대 기준으로 확정 (자동 변환 방지)
      const curGrade = MultiState.activeGrade || '2학년';
      AppState.detectedGrade = curGrade;
      if (gradeBadge) {
        gradeBadge.textContent = `🎯 ${curGrade} 작업 환경`;
        gradeBadge.classList.remove('hidden');
      }
    }

    // Parse Excel Workbook (Check for saved metadata sheet first!)
    function parseWorkbook(workbook, fileName) {
      // 1. Check if this is a previously exported App file with embedded state
      if (workbook.Sheets['_APP_STATE']) {
        try {
          const stateJsonStr = workbook.Sheets['_APP_STATE']['A1'] ? workbook.Sheets['_APP_STATE']['A1'].v : null;
          if (stateJsonStr) {
            const restoredState = JSON.parse(stateJsonStr);
            Object.assign(AppState, restoredState);
            AppState._surveyCleared = false;
            AppState._cleared = false;
            restoredBadge.classList.remove('hidden');
            gradeBadge.textContent = `🎯 ${AppState.detectedGrade} 감지됨`;
            gradeBadge.classList.remove('hidden');
            btnResetAll.classList.remove('hidden');
            appBody.classList.remove('hidden');
            updatePriorDataUI();
            updateSurveyDataUI();
            alert(`🎉 이전에 작업한 [${AppState.detectedGrade}] 그룹핑 파일이 성공적으로 복원되었습니다!\n(저장된 후보안: ${AppState.savedPlans.length}개)`);
            renderStep1();
            renderStep2UI();
            return;
          }
        } catch (e) {
          console.warn('메타데이터 파싱 실패, 신규 파일로 분석합니다.', e);
        }
      }

      // 2. Normal Raw Survey File Parsing
      restoredBadge.classList.add('hidden');

      // Scan all sheets to find the one with student responses
      let targetSheet = null;
      let rawRows = null;
      let headerRowIndex = -1;

      for (const sName of workbook.SheetNames) {
        if (sName === '_APP_STATE') continue;
        const s = workbook.Sheets[sName];
        const rows = XLSX.utils.sheet_to_json(s, { header: 1 });
        if (!rows || rows.length < 2) continue;

        for (let r = 0; r < Math.min(rows.length, 25); r++) {
          const rowStr = (rows[r] || []).join(' ');
          if ((rowStr.includes('반') || rowStr.includes('학급')) && (rowStr.includes('이름') || rowStr.includes('성명'))) {
            targetSheet = s;
            rawRows = rows;
            headerRowIndex = r;
            break;
          }
        }
        if (targetSheet) break;
      }

      // If not found by keyword, fallback to first sheet
      if (!targetSheet) {
        targetSheet = workbook.Sheets[workbook.SheetNames[0]];
        rawRows = XLSX.utils.sheet_to_json(targetSheet, { header: 1 });
        headerRowIndex = 0;
      }

      if (!rawRows || rawRows.length < 2) {
        alert('엑셀 파일에 유효한 학생 데이터가 없습니다.');
        return;
      }

      // If headerRowIndex was not found, search first 10 rows for any header
      if (headerRowIndex === -1) {
        headerRowIndex = 0;
        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const rowStr = (rawRows[i] || []).join(' ');
          if (rowStr.includes('반') || rowStr.includes('이름')) {
            headerRowIndex = i;
            break;
          }
        }
      }

      const headers = rawRows[headerRowIndex].map(h => (h !== undefined && h !== null ? String(h).trim() : ''));
      const dataRows = rawRows.slice(headerRowIndex + 1);

      // Identify Column Indices based on Header Keywords
      let colClass = -1, colNum = -1, colName = -1, colCareer = -1, colGrade = -1;
      let firstSem1Idx = -1, firstSem2Idx = -1;
      let targetCount1 = null, targetCount2 = null;
      const explicitSem1Cols = [];
      const explicitSem2Cols = [];

      headers.forEach((h, idx) => {
        if (/^학년$|^학년\s*\(|grade/i.test(h)) colGrade = idx;
        else if (/^반$|반\s*\(/.test(h)) colClass = idx;
        else if (/^번호$|번호\s*\(/.test(h)) colNum = idx;
        else if (/이름|성명/.test(h)) colName = idx;
        else if (/진로|관심/.test(h)) colCareer = idx;

        if (/1학기/.test(h)) {
          if (firstSem1Idx === -1) firstSem1Idx = idx;
          explicitSem1Cols.push(idx);
          const m = h.match(/택\s*(\d+)/);
          if (m) targetCount1 = parseInt(m[1], 10);
        } else if (/2학기/.test(h)) {
          if (firstSem2Idx === -1) firstSem2Idx = idx;
          explicitSem2Cols.push(idx);
          const m = h.match(/택\s*(\d+)/);
          if (m) targetCount2 = parseInt(m[1], 10);
        }
      });

      // Helper: check if column has valid elective subject names
      function hasElectiveData(colIdx) {
        if (colIdx < 0 || colIdx >= headers.length) return false;
        let count = 0;
        for (let i = 0; i < Math.min(dataRows.length, 25); i++) {
          const val = dataRows[i] && dataRows[i][colIdx] !== undefined ? String(dataRows[i][colIdx]).trim() : '';
          if (val && !/^(없음|x|X|무|-)$/.test(val)) count++;
        }
        return count > 0;
      }

      const sem1Cols = [];
      const sem2Cols = [];

      // 패턴 1: 각 열의 헤더마다 [1학기], [2학기]가 명시된 양식 (현재 양식)
      if (explicitSem1Cols.length > 1 || explicitSem2Cols.length > 1) {
        explicitSem1Cols.forEach(c => {
          if (hasElectiveData(c)) sem1Cols.push(c);
        });
        explicitSem2Cols.forEach(c => {
          if (hasElectiveData(c)) sem2Cols.push(c);
        });
      }
      // 패턴 2: 1학기 시작 열과 2학기 시작 열만 대표로 있고 다음 열들에는 학기명이 없는 양식 (구글 설문지/이전 양식)
      else if (firstSem1Idx !== -1 && firstSem2Idx !== -1 && firstSem1Idx < firstSem2Idx) {
        for (let c = firstSem1Idx; c < firstSem2Idx; c++) {
          if (hasElectiveData(c)) {
            sem1Cols.push(c);
            if (targetCount1 && sem1Cols.length >= targetCount1) break;
          }
        }
        for (let c = firstSem2Idx; c < headers.length; c++) {
          if (hasElectiveData(c)) {
            sem2Cols.push(c);
            if (targetCount2 && sem2Cols.length >= targetCount2) break;
          }
        }
      }
      // 패턴 3: 기타 폴백 (학기 키워드가 있는 열 직접 수집)
      else {
        headers.forEach((h, idx) => {
          if (/1학기/.test(h) && hasElectiveData(idx)) sem1Cols.push(idx);
          else if (/2학기/.test(h) && hasElectiveData(idx)) sem2Cols.push(idx);
        });
      }

      // Build Student Records & Collect Unique Subjects
      AppState.students = [];
      const sem1Set = new Set();
      const sem2Set = new Set();

      dataRows.forEach((row, idx) => {
        if (!row || row.length === 0) return;
        const nameVal = colName !== -1 ? String(row[colName] || '').trim() : '';
        const classVal = colClass !== -1 ? String(row[colClass] || '').trim() : '';
        const numVal = colNum !== -1 ? String(row[colNum] || '').trim() : '';

        // Exclude bottom summary/footer rows
        const rowStr = row.join(' ');
        if (/202\d학년도.*[1-3]학년/.test(rowStr) || /회색 과목.*개설/.test(rowStr)) {
          return;
        }

        if (!nameVal || /결과|학기|과목|타임스탬프|회색|개설|신청/.test(nameVal)) return;

        // Skip non-student rows where both class and number are empty or non-numeric
        if (!classVal && !numVal) return;

        const careerVal = colCareer !== -1 ? String(row[colCareer] || '').trim() : '탐색중';

        const s1Subjects = [];
        sem1Cols.forEach(c => {
          const rawVal = row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : '';
          if (rawVal && !/^(없음|x|X|무|-)$/.test(rawVal)) {
            const norm = normalizeSubject(rawVal);
            const existing = Array.from(sem1Set).find(s => normalizeSubject(s) === norm);
            const val = existing || rawVal;
            s1Subjects.push(val);
            sem1Set.add(val);
          }
        });

        const s2Subjects = [];
        sem2Cols.forEach(c => {
          const rawVal = row[c] !== undefined && row[c] !== null ? String(row[c]).trim() : '';
          if (rawVal && !/^(없음|x|X|무|-)$/.test(rawVal)) {
            const norm = normalizeSubject(rawVal);
            const existing = Array.from(sem2Set).find(s => normalizeSubject(s) === norm);
            const val = existing || rawVal;
            s2Subjects.push(val);
            sem2Set.add(val);
          }
        });

        if (s1Subjects.length === 0 && s2Subjects.length === 0) return;

        let gradeVal = '';
        if (colGrade !== -1 && row[colGrade] !== undefined) {
          const g = String(row[colGrade]).trim();
          if (g.includes('3')) gradeVal = '3학년';
          else if (g.includes('2')) gradeVal = '2학년';
          else if (g.includes('1')) gradeVal = '1학년';
        }
        if (!gradeVal && classVal) {
          if (/^3-|^3반|^3\s*반/.test(classVal)) gradeVal = '3학년';
          else if (/^2-|^2반|^2\s*반/.test(classVal)) gradeVal = '2학년';
        }
        if (!gradeVal && numVal) {
          if (/^3\d{4}/.test(numVal) || /^3-/.test(numVal)) gradeVal = '3학년';
          else if (/^2\d{4}/.test(numVal) || /^2-/.test(numVal)) gradeVal = '2학년';
        }

        AppState.students.push({
          id: `std_${AppState.students.length + 1}`,
          grade: gradeVal || '',
          classNum: classVal || '1',
          studentNum: numVal || String(AppState.students.length + 1),
          name: nameVal,
          career: careerVal,
          sem1: s1Subjects,
          sem2: s2Subjects,
          origSem1: [...s1Subjects],
          origSem2: [...s2Subjects]
        });
      });

      AppState.sem1Subjects = Array.from(sem1Set).sort();
      AppState.sem2Subjects = Array.from(sem2Set).sort();

      // Auto-detect group count per semester based on targetCount or number of columns
      AppState.sem1GroupCount = targetCount1 || sem1Cols.length || 3;
      AppState.sem2GroupCount = targetCount2 || sem2Cols.length || 4;

      // Reset configurations
      AppState.splitSubjects = { 1: {}, 2: {} };
      AppState.pinnedSubjects = { 1: {}, 2: {} };
      AppState.closedSubjects = { 1: [], 2: [] };
      AppState._closedImportedFromPrev = false;
      AppState._surveyCleared = false;
      AppState._cleared = false;
      AppState.subjectMemos = { 1: {}, 2: {} };
      AppState.studentPins = [];
      AppState.savedPlans = [];

      // 현재 사용자가 작업 중인 탭의 학년(MultiState.activeGrade)을 절대 기준으로 확정!
      // (내년도 3학년 설문에 올해 2학년 학번이 적혀 있어도 절대 2학년 탭으로 덮어쓰지 않고 3학년 격리 보장)
      const currentActiveGrade = MultiState.activeGrade || '2학년';
      AppState.detectedGrade = currentActiveGrade;
      MultiState.activeGrade = currentActiveGrade;

      // 이전 기준 날짜 1단계에서 폐강 확정된 과목이 있다면 현재 기준 날짜 1단계로 일회성 복사(불러오기만 하고 연결하지 않음)
      if (typeof importPrevDateClosedSubjectsOnce === 'function') {
        importPrevDateClosedSubjectsOnce(AppState, MultiState.activeYear, currentActiveGrade);
      }

      // 모든 학생의 학년 속성을 현재 작업 탭 학년으로 일괄 확정
      AppState.students.forEach(st => {
        st.grade = currentActiveGrade;
      });

      if (gradeBadge) {
        gradeBadge.textContent = `🎯 ${AppState.detectedGrade} 작업 환경`;
        gradeBadge.classList.remove('hidden');
      }
      appBody.classList.remove('hidden');
      btnResetAll.classList.remove('hidden');

      if (AppState.priorData) {
        runCrossCheckAnalysis();
      }

      updateSurveyDataUI();
      renderStep1();
      initStep2Controls();
      runOptimization(); // Run initial grouping
      saveAllState();
      healAcademicYearData(MultiState.activeYear);
    }

    // ==========================================
    // 2. STATE CONTROLS (RESET)
    // ==========================================

    window.resetCurrentGradeClean = function(grade) {
      const targetGrade = grade || MultiState.activeGrade || '2학년';
      const currAY = MultiState.activeAcademicYear || '2027학년도';
      const curAcadData = getAcadData(currAY);
      const dateList = (MultiState.datesByAcademicYear && MultiState.datesByAcademicYear[currAY]) || MultiState.yearsList || [];

      // 1. 해당 학년의 모든 날짜 탭에서 수강신청 및 사전데이터를 완전히 비움 (타 탭에서의 자동 부활 원천 방지)
      dateList.forEach(d => {
        if (!curAcadData[d]) curAcadData[d] = {};
        curAcadData[d][targetGrade] = createEmptyGradeState(targetGrade);
        curAcadData[d][targetGrade]._cleared = true;
      });

      // 2. 현재 AppState 완전 초기화
      for (const key of Object.keys(AppState)) {
        delete AppState[key];
      }
      Object.assign(AppState, createEmptyGradeState(targetGrade));
      AppState.detectedGrade = targetGrade;

      // 3. UI 갱신 (화면을 파일 등록 전 완전한 빈 화면으로 전환)
      updatePriorDataUI();
      const appBody = document.getElementById('appBody');
      const uploadSection = document.getElementById('uploadSection');
      if (appBody) appBody.classList.add('hidden');
      if (uploadSection) uploadSection.classList.remove('hidden');
      if (btnResetAll) btnResetAll.classList.add('hidden');

      // 4. 네비게이션 탭 갱신 및 상태 저장
      saveAllState();
      renderYearGradeNav();
      updateModalStats();
    };

    window.resetEntireApplicationClean = function() {
      const ay = '2027학년도';
      const d = '2027.10.11.';
      
      MultiState.academicYearsList = [ay];
      MultiState.activeAcademicYear = ay;
      MultiState.datesByAcademicYear = { [ay]: [d] };
      MultiState.yearsList = [d];
      MultiState.activeYear = d;
      MultiState.activeGrade = '2학년';
      MultiState.activeStep = 1;
      MultiState.curriculumByAcademicYear = { [ay]: [] };
      MultiState.publishersByAcademicYear = { [ay]: {} };
      MultiState.publisherSubjectNamesByAcademicYear = { [ay]: {} };
      MultiState.subjectGroupsByAcademicYear = { [ay]: { categories: [], mappings: {} } };
      MultiState.customTeacherOrder = [];
      MultiState.gradeClassCounts = { '1학년': 2, '2학년': 2, '3학년': 2 };
      MultiState.data = {
        [ay]: {
          [d]: {
            '2학년': createEmptyGradeState('2학년'),
            '3학년': createEmptyGradeState('3학년'),
            '전체': { curriculum: [], lastUpdated: null }
          }
        }
      };

      for (const key of Object.keys(AppState)) {
        delete AppState[key];
      }
      Object.assign(AppState, createEmptyGradeState('2학년'));

      updatePriorDataUI();
      const appBody = document.getElementById('appBody');
      const uploadSection = document.getElementById('uploadSection');
      const allGradesSection = document.getElementById('allGradesSection');
      if (appBody) appBody.classList.add('hidden');
      if (uploadSection) uploadSection.classList.remove('hidden');
      if (allGradesSection) allGradesSection.classList.add('hidden');
      if (btnResetAll) btnResetAll.classList.add('hidden');

      saveAllState();
      renderYearGradeNav();
      updateModalStats();
    };

    btnResetAll.addEventListener('click', () => {
      const curGrade = MultiState.activeGrade;
      const isAll = (curGrade === '전체');

      if (isAll) {
        if (confirm(`현재 [${MultiState.activeAcademicYear} 전체]의 교육과정 및 교원 시수 데이터를 초기화하시겠습니까?`)) {
          MultiState.curriculumByAcademicYear[MultiState.activeAcademicYear] = [];
          renderAllGradesDashboard();
          saveAllState();
          alert('전체 교육과정 데이터가 초기화되었습니다.');
        }
        return;
      }

      const choice = prompt(
        `[데이터 초기화 안내]\n\n` +
        `초기화 범위를 선택해주세요:\n\n` +
        `1: 현재 [${curGrade}] 초기화 (사전데이터 및 수강신청 파일 비우고 파일 등록 전 빈 화면으로 복귀)\n` +
        `2: 전체 데이터 초기화 (모든 학년도, 2·3학년, 교사 시수 등 전체를 처음 상태로 리셋)\n\n` +
        `원하시는 번호(1 또는 2)를 입력해주세요 (취소는 [취소] 버튼):`,
        "1"
      );

      if (!choice) return;

      if (choice.trim() === '1') {
        window.resetCurrentGradeClean(curGrade);
        alert(`✅ [${curGrade}] 데이터가 완전히 초기화되어 빈 화면으로 되돌아갔습니다.`);
      } else if (choice.trim() === '2') {
        if (confirm(`⚠️ 경고: 모든 학년도(2학년, 3학년, 교사 시수 등)의 작업 데이터가 영구히 삭제됩니다.\n\n정말로 전체 데이터를 완전히 초기화하시겠습니까?`)) {
          window.resetEntireApplicationClean();
          alert(`✅ 전체 데이터가 깨끗하게 초기화되었습니다.`);
        }
      }
    });

    // ==========================================