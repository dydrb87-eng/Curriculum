/**
 * 상지대관령고등학교 선택과목 그룹핑 & 수강신청 업무 자동화 시스템
 * Google Apps Script (GAS) 백엔드 스크립트
 */

/**
 * 1. 웹앱 배포 시 브라우저 접근 진입점 (GET 요청 처리)
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('상지대관령고등학교 - 선택과목 그룹핑 & 수강신청 자동화')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 2. 구글 스프레드시트 상단 메뉴 생성 (시트 연동 시)
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🏫 상지대관령고 도구')
      .addItem('🚀 선택과목 그룹핑 웹앱 열기', 'openDialogApp')
      .addSeparator()
      .addItem('📝 선택과목 수강신청 구글 폼 생성', 'createGoogleFormFromActivePlan')
      .addToUi();
  } catch (e) {
    // 독립형 웹앱 배포 시 무시
  }
}

/**
 * 모달 다이얼로그로 웹앱 열기
 */
function openDialogApp() {
  var html = HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setWidth(1280)
    .setHeight(860);
  SpreadsheetApp.getUi().showModalDialog(html, '상지대관령고등학교 선택과목 그룹핑 자동화 시스템');
}

/**
 * 3. 현재 구글 스프레드시트의 설문 응답 데이터 직접 불러오기 (백엔드 API)
 */
function getSpreadsheetData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return { success: false, message: '현재 연결된 스프레드시트가 없습니다. 엑셀 파일 업로드를 이용해주세요.' };
    }

    var sheets = ss.getSheets();
    var sheetsData = [];
    var stateJson = null;

    sheets.forEach(function(sheet) {
      var sName = sheet.getName();
      if (sName === '_APP_STATE') {
        try {
          stateJson = sheet.getRange(1, 1).getValue();
        } catch (err) {}
        return;
      }

      var values = sheet.getDataRange().getValues();
      if (values && values.length > 1) {
        // 날짜/타임스탬프 객체를 문자열로 포맷팅
        var formattedValues = values.map(function(row) {
          return row.map(function(cell) {
            if (cell instanceof Date) {
              return Utilities.formatDate(cell, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
            }
            return cell;
          });
        });

        sheetsData.push({
          name: sName,
          rows: formattedValues
        });
      }
    });

    return {
      success: true,
      fileName: ss.getName(),
      sheets: sheetsData,
      restoredState: stateJson ? JSON.parse(stateJson) : null
    };
  } catch (err) {
    return { success: false, message: '스프레드시트 데이터를 읽는 도중 오류가 발생했습니다: ' + err.toString() };
  }
}

/**
 * 4. 그룹핑 및 학생 배정 결과를 현재 구글 스프레드시트 시트 탭으로 직접 저장 (백엔드 API)
 */
function saveGroupingResultsToSheets(payloadJson) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return { success: false, message: '현재 활성화된 스프레드시트가 없습니다.' };
    }

    var payload = typeof payloadJson === 'string' ? JSON.parse(payloadJson) : payloadJson;
    var plans = payload.savedPlans || [];
    var students = payload.students || [];
    var stateData = payload.stateData || {};

    if (plans.length === 0) {
      return { success: false, message: '저장할 배치 안이 없습니다.' };
    }

    // A. 각 안별로 시트 생성 및 데이터 작성
    plans.forEach(function(plan, idx) {
      var sheetBaseName = plan.semester + '학기_' + (idx + 1) + '안';
      
      // 1. 배치표 시트
      var placementSheetName = sheetBaseName + '_배치표';
      var wsPlace = ss.getSheetByName(placementSheetName);
      if (wsPlace) ss.deleteSheet(wsPlace);
      wsPlace = ss.insertSheet(placementSheetName);

      var pRows = [
        ['[상지대관령고등학교] ' + (stateData.detectedGrade || '') + ' [' + plan.name + '] 과목 그룹핑 배치 현황'],
        ['총 충돌 인원: ' + plan.conflictCount + '명 | 편성 그룹: ' + plan.groups.length + '개 | 저장일시: ' + (plan.timestamp || '')],
        []
      ];

      var grpHeader = [];
      plan.groups.forEach(function(_, gIdx) { grpHeader.push((gIdx + 1) + '그룹'); });
      pRows.push(grpHeader);

      var maxLen = Math.max.apply(null, plan.groups.map(function(g) { return g.length; }));
      for (var r = 0; r < maxLen; r++) {
        var row = [];
        plan.groups.forEach(function(g) { row.push(g[r] || ''); });
        pRows.push(row);
      }

      wsPlace.getRange(1, 1, pRows.length, grpHeader.length).setValues(pRows);

      // Title & Subtitle Styling
      wsPlace.getRange(1, 1, 1, grpHeader.length).merge().setBackground('#1e3a8a').setFontColor('#ffffff').setFontSize(13).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
      wsPlace.setRowHeight(1, 35);
      wsPlace.getRange(2, 1, 1, grpHeader.length).merge().setBackground('#f1f5f9').setFontColor('#475569').setFontSize(9.5).setHorizontalAlignment('center').setVerticalAlignment('middle');
      wsPlace.setRowHeight(2, 22);

      // Header row
      wsPlace.getRange(4, 1, 1, grpHeader.length).setBackground('#1e40af').setFontColor('#ffffff').setFontSize(10.5).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
      wsPlace.setRowHeight(4, 28);

      // Data rows
      if (maxLen > 0) {
        var dataRange = wsPlace.getRange(5, 1, maxLen, grpHeader.length);
        dataRange.setFontSize(10).setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
        for (var dr = 0; dr < maxLen; dr++) {
          wsPlace.setRowHeight(5 + dr, 24);
          var rowRange = wsPlace.getRange(5 + dr, 1, 1, grpHeader.length);
          rowRange.setBackground(dr % 2 === 1 ? '#f8fafc' : '#ffffff');
        }
      }
      wsPlace.autoResizeColumns(1, grpHeader.length);

      // 2. 학생 시간표 시트 (2단 입체 매트릭스)
      var ttSheetName = sheetBaseName + '_학생시간표';
      var wsTT = ss.getSheetByName(ttSheetName);
      if (wsTT) ss.deleteSheet(wsTT);
      wsTT = ss.insertSheet(ttSheetName);

      var ttRows = [
        ['[상지대관령고등학교] ' + (stateData.detectedGrade || '') + ' [' + plan.name + '] 학생별 그룹 배정 시간표 (개인별 이동수업 시간표)'],
        ['총 학생 수: ' + students.length + '명 | 수강 충돌 학생 수: ' + plan.conflictCount + '명 | 저장일시: ' + (plan.timestamp || '')],
        []
      ];

      var h1 = ['반', '번호', '이름', '진로/관심학과'];
      var h2 = ['', '', '', ''];

      var colStart = 5;
      var mergeRanges = [
        wsTT.getRange(4, 1, 2, 1),
        wsTT.getRange(4, 2, 2, 1),
        wsTT.getRange(4, 3, 2, 1),
        wsTT.getRange(4, 4, 2, 1)
      ];

      var groupColors = ['#1e40af', '#0f766e', '#6d28d9', '#c2410c', '#b45309', '#374151'];
      var groupSpans = [];

      var groupCounts = plan.groupCounts || [];
      plan.groups.forEach(function(groupSubjs, gIdx) {
        var span = Math.max(groupSubjs.length, 1);
        var gConf = groupCounts[gIdx] !== undefined ? groupCounts[gIdx] : 0;
        groupSpans.push({ startCol: colStart, span: span, gIdx: gIdx });
        h1.push((gIdx + 1) + '그룹 (중복 ' + gConf + '명)');
        for (var k = 1; k < span; k++) h1.push('');

        if (span > 1) {
          mergeRanges.push(wsTT.getRange(4, colStart, 1, span));
        }

        if (groupSubjs.length === 0) {
          h2.push('과목 없음');
        } else {
          groupSubjs.forEach(function(s) { h2.push(s); });
        }
        colStart += span;
      });

      h1.push('수강 배정 상태');
      h2.push('');
      mergeRanges.push(wsTT.getRange(4, colStart, 2, 1));
      var totalCols = colStart;

      ttRows.push(h1);
      ttRows.push(h2);

      // 학생별 데이터 행 채우기
      var sem = plan.semester;
      var conflictRows = [];
      students.forEach(function(st, sIdx) {
        var row = [st.classNum, st.studentNum, st.name, st.career];
        var choices = new Set(sem === 1 ? st.sem1 : st.sem2);
        var hasConflict = false;
        var confList = [];

        plan.groups.forEach(function(groupSubjs, gIdx) {
          var matched = [];
          groupSubjs.forEach(function(sName) {
            var parent = sName.replace(/-[A-Z]$/, '');
            if (choices.has(parent) && matched.indexOf(sName) === -1) {
              matched.push(sName);
            }
          });

          if (matched.length > 1) {
            hasConflict = true;
            confList.push((gIdx + 1) + '그룹');
          }

          if (groupSubjs.length === 0) {
            row.push('-');
          } else {
            groupSubjs.forEach(function(sName) {
              if (matched.indexOf(sName) !== -1) {
                row.push(matched.length > 1 ? '중복수강' : '수강');
              } else {
                row.push('');
              }
            });
          }
        });

        if (hasConflict) {
          conflictRows.push(6 + sIdx);
        }
        row.push(hasConflict ? '중복 (' + confList.join(', ') + ')' : '정상 배정');
        ttRows.push(row);
      });

      // Compute subject selection counts
      var subjCounts = {};
      plan.groups.forEach(function(groupSubjs) {
        groupSubjs.forEach(function(sName) {
          subjCounts[sName] = 0;
        });
      });

      students.forEach(function(st) {
        var choices = new Set(sem === 1 ? st.sem1 : st.sem2);
        plan.groups.forEach(function(groupSubjs) {
          groupSubjs.forEach(function(sName) {
            var parent = sName.replace(/-[A-Z]$/, '');
            if (choices.has(parent)) {
              if (subjCounts[sName] !== undefined) subjCounts[sName]++;
            }
          });
        });
      });

      // 1. Spacer Blank Row
      var blankRow = [];
      for (var bi = 0; bi < totalCols; bi++) blankRow.push('');
      ttRows.push(blankRow);

      // 2. Subject Totals Row (N명)
      var subjSumRow = ['', '', '', ''];
      plan.groups.forEach(function(groupSubjs) {
        if (groupSubjs.length === 0) {
          subjSumRow.push('');
        } else {
          groupSubjs.forEach(function(sName) {
            subjSumRow.push((subjCounts[sName] || 0) + '명');
          });
        }
      });
      subjSumRow.push('');
      ttRows.push(subjSumRow);

      // 3. Group Totals Row (각 그룹 첫 번째 과목 아래에 N명)
      var grpSumRow = ['', '', '', ''];
      plan.groups.forEach(function(groupSubjs) {
        var grpTotal = groupSubjs.reduce(function(acc, sName) { return acc + (subjCounts[sName] || 0); }, 0);
        if (groupSubjs.length === 0) {
          grpSumRow.push(grpTotal + '명');
        } else {
          groupSubjs.forEach(function(sName, sIdx) {
            if (sIdx === 0) {
              grpSumRow.push(grpTotal + '명');
            } else {
              grpSumRow.push('');
            }
          });
        }
      });
      grpSumRow.push('');
      ttRows.push(grpSumRow);

      wsTT.getRange(1, 1, ttRows.length, totalCols).setValues(ttRows);

      // Title & Subtitle
      wsTT.getRange(1, 1, 1, totalCols).merge().setBackground('#1e3a8a').setFontColor('#ffffff').setFontSize(13).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
      wsTT.setRowHeight(1, 35);
      wsTT.getRange(2, 1, 1, totalCols).merge().setBackground('#f1f5f9').setFontColor('#475569').setFontSize(9.5).setHorizontalAlignment('center').setVerticalAlignment('middle');
      wsTT.setRowHeight(2, 22);

      // Merge header cells
      mergeRanges.forEach(function(range) {
        range.merge();
      });

      // Style Info Headers
      wsTT.getRange(4, 1, 2, 4).setBackground('#1e40af').setFontColor('#ffffff').setFontSize(10.5).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
      wsTT.getRange(4, totalCols, 2, 1).setBackground('#1e40af').setFontColor('#ffffff').setFontSize(10.5).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');

      // Style Group Headers
      groupSpans.forEach(function(item) {
        var gBg = groupColors[item.gIdx % groupColors.length];
        wsTT.getRange(4, item.startCol, 1, item.span).setBackground(gBg).setFontColor('#ffffff').setFontSize(10.5).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
        wsTT.getRange(5, item.startCol, 1, item.span).setBackground('#dbeafe').setFontColor('#1e3a8a').setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
      });

      wsTT.setRowHeight(4, 28);
      wsTT.setRowHeight(5, 24);

      // Style Data Rows
      if (students.length > 0) {
        var bodyRange = wsTT.getRange(6, 1, students.length, totalCols);
        bodyRange.setFontSize(10).setVerticalAlignment('middle').setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
        wsTT.getRange(6, 1, students.length, 3).setHorizontalAlignment('center');
        wsTT.getRange(6, 3, students.length, 1).setFontWeight('bold'); // 이름 bold
        wsTT.getRange(6, 4, students.length, 1).setHorizontalAlignment('left'); // 진로 left
        wsTT.getRange(6, 5, students.length, totalCols - 4).setHorizontalAlignment('center');

        for (var sIdx = 0; sIdx < students.length; sIdx++) {
          var rNum = 6 + sIdx;
          wsTT.setRowHeight(rNum, 22);
          if (sIdx % 2 === 1) {
            wsTT.getRange(rNum, 1, 1, totalCols).setBackground('#f8fafc');
          }
        }

        // Highlight conflict rows
        conflictRows.forEach(function(rNum) {
          wsTT.getRange(rNum, totalCols).setBackground('#fee2e2').setFontColor('#dc2626').setFontWeight('bold');
        });

        // Bottom summary rows styling
        var spacerRowIdx = 6 + students.length;
        var subjRowIdx = spacerRowIdx + 1;
        var grpRowIdx = spacerRowIdx + 2;

        wsTT.setRowHeight(spacerRowIdx, 14);
        wsTT.setRowHeight(subjRowIdx, 24);
        wsTT.setRowHeight(grpRowIdx, 26);

        var subjRange = wsTT.getRange(subjRowIdx, 1, 1, totalCols);
        subjRange.setBackground('#eff6ff').setFontColor('#1e40af').setFontSize(10).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);

        var grpRange = wsTT.getRange(grpRowIdx, 1, 1, totalCols);
        grpRange.setBackground('#f8fafc').setFontSize(10.5).setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle').setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);

        // Highlight group totals
        groupSpans.forEach(function(item) {
          wsTT.getRange(grpRowIdx, item.startCol, 1, 1).setBackground('#dbeafe').setFontColor('#1e3a8a').setFontWeight('bold');
        });
      }

      wsTT.autoResizeColumns(1, totalCols);
    });

    // B. _APP_STATE 메타데이터 시트 저장 (추후 재방문 시 100% 자동 복원용)
    var wsState = ss.getSheetByName('_APP_STATE');
    if (!wsState) {
      wsState = ss.insertSheet('_APP_STATE');
      wsState.hideSheet(); // 사용자 눈에 띄지 않게 숨김 처리
    }
    wsState.clear();
    wsState.getRange(1, 1).setValue(JSON.stringify(stateData));

    return {
      success: true,
      message: plans.length + '개의 그룹핑 배치표 및 학생 시간표가 구글 스프레드시트에 성공적으로 저장되었습니다!',
      url: ss.getUrl()
    };
  } catch (err) {
    return { success: false, message: '구글 시트 저장 실패: ' + err.toString() };
  }
}

/**
 * 5. 선택과목 수강신청 구글 폼(Google Forms) 자동 생성 (백엔드 API)
 * 선생님 요청 질문 형식 100% 반영:
 *  - 반 (숫자만 입력) [필수/숫자검증]
 *  - 번호 (숫자만 입력) [필수/숫자검증]
 *  - 이름 [필수]
 *  - 진로, 관심학과 (*진로 미정인 경우: 탐색중) [필수]
 *  - [1학기] N개 선택과목 중 - K번째 선택과목 [필수/해당 그룹 과목 보기]
 *  - [2학기] M개 선택과목 중 - K번째 선택과목 [필수/해당 그룹 과목 보기]
 *  - 응답용 구글 스프레드시트 자동 생성 및 연동
 */
function createGoogleFormForCourseSelection(paramsJson) {
  try {
    var params = typeof paramsJson === 'string' ? JSON.parse(paramsJson) : paramsJson;
    var year = params.year || '2027';
    var grade = params.grade || '3학년';
    var title = params.title || (year + '학년도 ' + grade + ' 선택과목 수강신청');
    var description = params.description || 
      '상지대관령고등학교 학생 여러분, 각 학기별 선택과목군을 확인하고 그룹별로 수강할 과목을 1개씩 신중하게 선택해 주세요.\n' +
      '※ 제출 후 수정이 불가하므로 자신의 진로와 적성을 고려하여 선택 바랍니다.';

    // 1. 구글 폼 생성
    var form = FormApp.create(title);
    form.setTitle(title);
    form.setDescription(description);
    form.setAllowResponseEdits(false);

    // 2. 기본 인적사항 질문 (선생님 요청 질문 순서 및 유효성 검사)
    // 1) 반 (숫자만 입력)
    var classItem = form.addTextItem();
    classItem.setTitle('반 (숫자만 입력)')
             .setRequired(true);
    var classValidation = FormApp.createTextValidation()
      .setHelpText('숫자만 입력해 주세요.')
      .requireWholeNumber()
      .build();
    classItem.setValidation(classValidation);

    // 2) 번호 (숫자만 입력)
    var numItem = form.addTextItem();
    numItem.setTitle('번호 (숫자만 입력)')
           .setRequired(true);
    var numValidation = FormApp.createTextValidation()
      .setHelpText('숫자만 입력해 주세요.')
      .requireWholeNumber()
      .build();
    numItem.setValidation(numValidation);

    // 3) 이름
    var nameItem = form.addTextItem();
    nameItem.setTitle('이름')
            .setRequired(true);

    // 4) 진로, 관심학과
    var careerItem = form.addTextItem();
    careerItem.setTitle('진로, 관심학과')
              .setHelpText('*진로 미정인 경우: 탐색중')
              .setRequired(true);

    // 3. 1학기 선택과목군 질문 생성
    var sem1Groups = params.sem1Groups || [];
    if (sem1Groups.length > 0) {
      var total1 = sem1Groups.length;
      sem1Groups.forEach(function(groupSubjs, idx) {
        if (!groupSubjs || groupSubjs.length === 0) return;
        var qTitle = '[1학기] ' + total1 + '개 선택과목 중 - ' + (idx + 1) + '번째 선택과목';
        var mcItem = form.addMultipleChoiceItem();
        mcItem.setTitle(qTitle).setRequired(true);
        var choices = groupSubjs.map(function(s) {
          return mcItem.createChoice(s);
        });
        mcItem.setChoices(choices);
      });
    }

    // 4. 2학기 선택과목군 질문 생성
    var sem2Groups = params.sem2Groups || [];
    if (sem2Groups.length > 0) {
      var total2 = sem2Groups.length;
      sem2Groups.forEach(function(groupSubjs, idx) {
        if (!groupSubjs || groupSubjs.length === 0) return;
        var qTitle = '[2학기] ' + total2 + '개 선택과목 중 - ' + (idx + 1) + '번째 선택과목';
        var mcItem = form.addMultipleChoiceItem();
        mcItem.setTitle(qTitle).setRequired(true);
        var choices = groupSubjs.map(function(s) {
          return mcItem.createChoice(s);
        });
        mcItem.setChoices(choices);
      });
    }

    // 5. 응답 수집용 구글 스프레드시트 자동 생성 및 폼 연동
    var responseSs = SpreadsheetApp.create(title + ' (설문 응답 결과)');
    form.setDestination(FormApp.DestinationType.SPREADSHEET, responseSs.getId());

    return {
      success: true,
      title: title,
      formId: form.getId(),
      publishedUrl: form.getPublishedUrl(),
      editUrl: form.getEditUrl(),
      spreadsheetUrl: responseSs.getUrl(),
      message: '구글 폼 설문지와 응답 스프레드시트가 성공적으로 생성되었습니다!'
    };
  } catch (err) {
    return {
      success: false,
      message: '구글 폼 생성 실패: ' + err.toString()
    };
  }
}

/**
 * 구글 스프레드시트 상단 메뉴에서 바로 폼 생성 호출용
 */
function createGoogleFormFromActivePlan() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    var stateSheet = ss.getSheetByName('_APP_STATE');
    if (!stateSheet) {
      SpreadsheetApp.getUi().alert('먼저 웹앱에서 과목 그룹핑을 진행하고 [구글 시트에 저장]을 완료해주세요.');
      return;
    }
    var rawJson = stateSheet.getRange(1, 1).getValue();
    if (!rawJson) {
      SpreadsheetApp.getUi().alert('저장된 그룹핑 작업 데이터가 없습니다.');
      return;
    }
    var stateData = JSON.parse(rawJson);
    var savedPlans = stateData.savedPlans || [];
    var sem1Plan = savedPlans.filter(function(p) { return p.semester === 1; }).pop();
    var sem2Plan = savedPlans.filter(function(p) { return p.semester === 2; }).pop();

    var params = {
      year: '2027',
      grade: stateData.detectedGrade || '3학년',
      sem1Groups: sem1Plan ? sem1Plan.groups : [],
      sem2Groups: sem2Plan ? sem2Plan.groups : []
    };

    var res = createGoogleFormForCourseSelection(params);
    if (res.success) {
      SpreadsheetApp.getUi().alert('🎉 구글 폼 생성 완료!\n\n학생용 설문 링크:\n' + res.publishedUrl + '\n\n관리자 편집 링크:\n' + res.editUrl);
    } else {
      SpreadsheetApp.getUi().alert('폼 생성 실패: ' + res.message);
    }
  } catch (e) {
    SpreadsheetApp.getUi().alert('오류 발생: ' + e.toString());
  }
}

/**
 * 6. 웹앱 HTTP POST 핸들러 (외부 연동 지원)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'createGoogleForm') {
      var result = createGoogleFormForCourseSelection(data.params);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === 'saveGrouping') {
      var resSave = saveGroupingResultsToSheets(data.payload);
      return ContentService.createTextOutput(JSON.stringify(resSave))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: '알 수 없는 action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
