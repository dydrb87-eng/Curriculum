    // EXCEL STYLING ENGINE (xlsx-js-style helper)
    // ==========================================
    const ExcelStyler = {
      fontFamily: '맑은 고딕',
      colors: {
        navyDark: '1E3A8A',
        navyMid: '1E40AF',
        blueBrand: '2563EB',
        blueLight: 'DBEAFE',
        blueSoft: 'EFF6FF',
        slateDark: '0F172A',
        slateText: '1E293B',
        slateMuted: '475569',
        slateBg: 'F8FAFC',
        slateHeaderBg: 'F1F5F9',
        borderGrid: '94A3B8', // 명확하고 선명한 슬레이트 그리드 테두리
        borderThick: '1E293B', // 그룹 간 굵은 구분선 테두리
        redText: 'DC2626',
        redBg: 'FEE2E2',
        redBorder: 'EF4444',
        greenText: '16A34A',
        greenBg: 'DCFCE7',
        summaryBg: 'E2E8F0'
      },
      groupFills: ['1E40AF', '0F766E', '6D28D9', 'C2410C', 'B45309', '374151', '0284C7', '4F46E5'],

      getBorder(isGroupRight = false, isGroupLeft = false, topStyle = 'thin', bottomStyle = 'thin') {
        return {
          top: { style: topStyle, color: { rgb: topStyle === 'medium' ? this.colors.borderThick : this.colors.borderGrid } },
          bottom: { style: bottomStyle, color: { rgb: bottomStyle === 'medium' ? this.colors.borderThick : (bottomStyle === 'double' ? this.colors.slateDark : this.colors.borderGrid) } },
          left: { style: isGroupLeft ? 'medium' : 'thin', color: { rgb: isGroupLeft ? this.colors.borderThick : this.colors.borderGrid } },
          right: { style: isGroupRight ? 'medium' : 'thin', color: { rgb: isGroupRight ? this.colors.borderThick : this.colors.borderGrid } }
        };
      },

      cellBorders(top = true, bottom = true, left = true, right = true, thickTop = false, thickBottom = false, thickLeft = false, thickRight = false) {
        return {
          top: top ? { style: thickTop ? 'medium' : 'thin', color: { rgb: thickTop ? this.colors.borderThick : this.colors.borderGrid } } : undefined,
          bottom: bottom ? { style: thickBottom ? 'medium' : 'thin', color: { rgb: thickBottom ? this.colors.borderThick : this.colors.borderGrid } } : undefined,
          left: left ? { style: thickLeft ? 'medium' : 'thin', color: { rgb: thickLeft ? this.colors.borderThick : this.colors.borderGrid } } : undefined,
          right: right ? { style: thickRight ? 'medium' : 'thin', color: { rgb: thickRight ? this.colors.borderThick : this.colors.borderGrid } } : undefined
        };
      },

      setCell(ws, r, c, style) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!ws[ref]) {
          ws[ref] = { t: 's', v: '' };
        }
        ws[ref].s = style;
      },

      applyStyle(cell, style) {
        if (!cell) return;
        cell.s = style;
      },

      setRange(ws, startR, startC, endR, endC, style) {
        for (let r = startR; r <= endR; r++) {
          for (let c = startC; c <= endC; c++) {
            this.setCell(ws, r, c, style);
          }
        }
      },

      titleStyle(isGroupRight = false) {
        return {
          font: { name: this.fontFamily, sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: this.colors.navyDark } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: this.getBorder(isGroupRight, false, 'medium', 'medium')
        };
      },

      subtitleStyle(isGroupRight = false) {
        return {
          font: { name: this.fontFamily, sz: 9.5, color: { rgb: this.colors.slateMuted }, italic: false },
          fill: { fgColor: { rgb: this.colors.slateHeaderBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: this.getBorder(isGroupRight, false, 'thin', 'medium')
        };
      },

      headerStyle(bgColor = this.colors.navyMid, isGroupRight = false, isGroupLeft = false) {
        return {
          font: { name: this.fontFamily, sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: this.getBorder(isGroupRight, isGroupLeft, 'medium', 'medium')
        };
      },

      subHeaderStyle(isGroupRight = false, isGroupLeft = false) {
        return {
          font: { name: this.fontFamily, sz: 10, bold: true, color: { rgb: this.colors.navyDark } },
          fill: { fgColor: { rgb: this.colors.blueLight } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: this.getBorder(isGroupRight, isGroupLeft, 'thin', 'medium')
        };
      },

      dataCenter(isEven, isGroupRight = false, isGroupLeft = false) {
        return {
          font: { name: this.fontFamily, sz: 10, color: { rgb: this.colors.slateText } },
          fill: { fgColor: { rgb: isEven ? this.colors.slateBg : 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: this.getBorder(isGroupRight, isGroupLeft)
        };
      },

      dataLeft(isEven, isGroupRight = false, isGroupLeft = false) {
        return {
          font: { name: this.fontFamily, sz: 10, color: { rgb: this.colors.slateText } },
          fill: { fgColor: { rgb: isEven ? this.colors.slateBg : 'FFFFFF' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: this.getBorder(isGroupRight, isGroupLeft)
        };
      },

      dataText(isEven, isGroupRight = false, isGroupLeft = false) {
        return {
          font: { name: this.fontFamily, sz: 10, color: { rgb: this.colors.slateText } },
          fill: { fgColor: { rgb: isEven ? this.colors.slateBg : 'FFFFFF' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          border: this.getBorder(isGroupRight, isGroupLeft)
        };
      },

      dataBold(isEven, isGroupRight = false, isGroupLeft = false) {
        return {
          font: { name: this.fontFamily, sz: 10, bold: true, color: { rgb: this.colors.slateDark } },
          fill: { fgColor: { rgb: isEven ? this.colors.slateBg : 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: this.getBorder(isGroupRight, isGroupLeft)
        };
      },

      dataSelected(isEven, isGroupRight = false, isGroupLeft = false) {
        return {
          font: { name: this.fontFamily, sz: 10, bold: true, color: { rgb: '1D4ED8' } },
          fill: { fgColor: { rgb: 'EFF6FF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: this.getBorder(isGroupRight, isGroupLeft)
        };
      },

      dataWarning(isGroupRight = false, isGroupLeft = false) {
        return {
          font: { name: this.fontFamily, sz: 10, bold: true, color: { rgb: this.colors.redText } },
          fill: { fgColor: { rgb: this.colors.redBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: this.getBorder(isGroupRight, isGroupLeft)
        };
      },

      summaryStyle(isWarning = false, isGroupRight = false, isGroupLeft = false) {
        return {
          font: {
            name: this.fontFamily,
            sz: 10.5,
            bold: true,
            color: { rgb: isWarning ? this.colors.redText : this.colors.slateDark }
          },
          fill: { fgColor: { rgb: isWarning ? this.colors.redBg : this.colors.summaryBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: this.getBorder(isGroupRight, isGroupLeft, 'medium', 'double')
        };
      },

      summaryCountStyle(fill = 'F1F5F9', color = '1E40AF', isGroupRight = false, isGroupLeft = false) {
        return {
          font: {
            name: this.fontFamily,
            sz: 10.5,
            bold: true,
            color: { rgb: color }
          },
          fill: { fgColor: { rgb: fill } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: this.getBorder(isGroupRight, isGroupLeft, 'thin', 'thin')
        };
      }
    };

    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const appBody = document.getElementById('appBody');
    const gradeBadge = document.getElementById('gradeBadge');
    const restoredBadge = document.getElementById('restoredBadge');
    const btnResetAll = document.getElementById('btnResetAll');

    // Navigation Tabs
    const navTab1 = document.getElementById('navTab1');
    const navTab2 = document.getElementById('navTab2');
    const step1View = document.getElementById('step1View');
    const step2View = document.getElementById('step2View');

    // Step 1 Elements
    const sem1TabBtn = document.getElementById('sem1TabBtn');
    const sem2TabBtn = document.getElementById('sem2TabBtn');
    const thresholdInput = document.getElementById('thresholdInput');
    const studentSearchInput = document.getElementById('studentSearchInput');
    const btnExportStep1 = document.getElementById('btnExportStep1');
    const matrixTable = document.getElementById('matrixTable');
    const matrixTableTitle = document.getElementById('matrixTableTitle');

    // Stats
    const statTotalStudents = document.getElementById('statTotalStudents');
    const statSubjectCount = document.getElementById('statSubjectCount');
    const statElectiveCount = document.getElementById('statElectiveCount');
    const statUnderThresholdCount = document.getElementById('statUnderThresholdCount');

    // Step 2 Elements
    const step2Sem1Btn = document.getElementById('step2Sem1Btn');
    const step2Sem2Btn = document.getElementById('step2Sem2Btn');
    const btnRegroup = document.getElementById('btnRegroup');
    const btnSavePlan = document.getElementById('btnSavePlan');
    const btnExportAllPlans = document.getElementById('btnExportAllPlans');
    const groupCardsContainer = document.getElementById('groupCardsContainer');
    const splitSubjectsContainer = document.getElementById('splitSubjectsContainer');
    const pinnedSubjectsContainer = document.getElementById('pinnedSubjectsContainer');
    const conflictAlertBox = document.getElementById('conflictAlertBox');
    const conflictTableBody = document.getElementById('conflictTableBody');
    const conflictDetailCount = document.getElementById('conflictDetailCount');
    const statConflictCount = document.getElementById('statConflictCount');
    const conflictStatusBadge = document.getElementById('conflictStatusBadge');
    const statGroupCountDisplay = document.getElementById('statGroupCountDisplay');
    const statSavedPlansCount = document.getElementById('statSavedPlansCount');
    const savedPlansList = document.getElementById('savedPlansList');

    // Conflict Target Range & Historical Minimum Elements
    const targetConflictMinInput = document.getElementById('targetConflictMinInput');
    const targetConflictMaxInput = document.getElementById('targetConflictMaxInput');
    const btnApplyTargetN = document.getElementById('btnApplyTargetN');
    const btnResetConflictTarget = document.getElementById('btnResetConflictTarget');
    const statBestConflictCount = document.getElementById('statBestConflictCount');
    const btnRestoreBestPlan = document.getElementById('btnRestoreBestPlan');

    // Replicated Timetable Toolbar Elements
    const targetConflictMinInput2 = document.getElementById('targetConflictMinInput2');
    const targetConflictMaxInput2 = document.getElementById('targetConflictMaxInput2');
    const btnApplyTargetN2 = document.getElementById('btnApplyTargetN2');
    const btnResetConflictTarget2 = document.getElementById('btnResetConflictTarget2');
    const btnRegroup2 = document.getElementById('btnRegroup2');
    const btnSavePlan2 = document.getElementById('btnSavePlan2');
    const btnExportAllPlans2 = document.getElementById('btnExportAllPlans2');

    // Together / Separate Constraint Controls
    const togetherSubj1Select = document.getElementById('togetherSubj1Select');
    const togetherSubj2Select = document.getElementById('togetherSubj2Select');
    const btnAddTogetherPair = document.getElementById('btnAddTogetherPair');
    const togetherPairsList = document.getElementById('togetherPairsList');

    const separateSubj1Select = document.getElementById('separateSubj1Select');
    const separateSubj2Select = document.getElementById('separateSubj2Select');
    const btnAddSeparatePair = document.getElementById('btnAddSeparatePair');
    const separatePairsList = document.getElementById('separatePairsList');

    // Prior Data & Cross-Check Elements
    const priorFileInput = document.getElementById('priorFileInput');
    const priorDropZone = document.getElementById('priorDropZone');
    const priorUploadZone = document.getElementById('priorUploadZone');
    const priorStatusBadge = document.getElementById('priorStatusBadge');
    const priorLoadedInfo = document.getElementById('priorLoadedInfo');
    const priorLoadedSummary = document.getElementById('priorLoadedSummary');
    const priorClassBadges = document.getElementById('priorClassBadges');
    const priorLoadedFileName = document.getElementById('priorLoadedFileName');
    const btnClearPrior = document.getElementById('btnClearPrior');
    const btnSamplePrior = document.getElementById('btnSamplePrior');
    const crossCheckAlertPanel = document.getElementById('crossCheckAlertPanel');
    const missingCountDisplay = document.getElementById('missingCountDisplay');
    const duplicateCountDisplay = document.getElementById('duplicateCountDisplay');
    const missingBadgeCount = document.getElementById('missingBadgeCount');
    const duplicateBadgeCount = document.getElementById('duplicateBadgeCount');
    const missingStudentsTbody = document.getElementById('missingStudentsTbody');
    const duplicateStudentsTbody = document.getElementById('duplicateStudentsTbody');
    const btnExportCrossCheckExcel = document.getElementById('btnExportCrossCheckExcel');
    const btnToggleCrossCheckDetails = document.getElementById('btnToggleCrossCheckDetails');
    const crossCheckDetailsContainer = document.getElementById('crossCheckDetailsContainer');
    const crossCheckToggleText = document.getElementById('crossCheckToggleText');

    // ==========================================