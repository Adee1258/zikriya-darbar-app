/**
 * DateRangePicker — fully custom, no external dependencies.
 * Shows a modal calendar to pick From and To dates.
 * Props:
 *   dateFrom, dateTo          — currently selected dates (YYYY-MM-DD string or '')
 *   onChangeDateFrom(str)     — called when From date changes
 *   onChangeDateTo(str)       — called when To date changes
 *   onSearch()                — called when user taps "Search / Apply"
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../constants';

interface Props {
  dateFrom: string;
  dateTo: string;
  onChangeDateFrom: (d: string) => void;
  onChangeDateTo: (d: string) => void;
  onSearch: () => void;
  accentColor?: string;
}

type Selecting = 'from' | 'to';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toISO = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const parseISO = (s: string): Date | null => {
  if (!s) return null;
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
};

const isoToDisplay = (s: string) => {
  const d = parseISO(s);
  if (!d) return '— Not set —';
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
};

const DateRangePicker: React.FC<Props> = ({
  dateFrom, dateTo, onChangeDateFrom, onChangeDateTo, onSearch, accentColor,
}) => {
  const accent = accentColor ?? COLORS.primary;

  const [visible, setVisible] = useState(false);
  const [selecting, setSelecting] = useState<Selecting>('from');

  // Calendar navigation state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed

  const openFor = (mode: Selecting) => {
    setSelecting(mode);
    // Navigate calendar to currently selected date if set
    const existing = mode === 'from' ? parseISO(dateFrom) : parseISO(dateTo);
    if (existing) {
      setCalYear(existing.getFullYear());
      setCalMonth(existing.getMonth());
    } else {
      setCalYear(today.getFullYear());
      setCalMonth(today.getMonth());
    }
    setVisible(true);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const selectDay = (day: number) => {
    const iso = toISO(calYear, calMonth, day);
    if (selecting === 'from') {
      onChangeDateFrom(iso);
      // Auto-switch to 'to' picker if to is not set or is before from
      if (!dateTo || dateTo < iso) {
        onChangeDateTo('');
        setSelecting('to');
      } else {
        setVisible(false);
      }
    } else {
      onChangeDateTo(iso);
      setVisible(false);
    }
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full rows of 7
  while (cells.length % 7 !== 0) cells.push(null);

  const fromDate = parseISO(dateFrom);
  const toDate = parseISO(dateTo);

  const isSelected = (day: number | null) => {
    if (!day) return false;
    const iso = toISO(calYear, calMonth, day);
    return iso === dateFrom || iso === dateTo;
  };

  const isInRange = (day: number | null) => {
    if (!day || !fromDate || !toDate) return false;
    const iso = toISO(calYear, calMonth, day);
    return iso > dateFrom && iso < dateTo;
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      calMonth === today.getMonth() &&
      calYear === today.getFullYear()
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* From / To selector buttons */}
      <View style={styles.selectorRow}>
        <TouchableOpacity
          style={[styles.selectorBtn, { borderColor: accent }, selecting === 'from' && visible && styles.selectorBtnActive]}
          onPress={() => openFor('from')}
        >
          <Text style={styles.selectorLabel}>From</Text>
          <Text style={[styles.selectorValue, dateFrom ? { color: accent } : {}]}>
            {dateFrom ? isoToDisplay(dateFrom) : 'Select date'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.selectorArrow}>→</Text>

        <TouchableOpacity
          style={[styles.selectorBtn, { borderColor: accent }, selecting === 'to' && visible && styles.selectorBtnActive]}
          onPress={() => openFor('to')}
        >
          <Text style={styles.selectorLabel}>To</Text>
          <Text style={[styles.selectorValue, dateTo ? { color: accent } : {}]}>
            {dateTo ? isoToDisplay(dateTo) : 'Select date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search button */}
      <TouchableOpacity
        style={[styles.searchBtn, { backgroundColor: accent }]}
        onPress={() => { setVisible(false); onSearch(); }}
      >
        <Text style={styles.searchBtnText}>🔍 Search</Text>
      </TouchableOpacity>

      {/* Calendar Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.calendarCard}>
            {/* Title */}
            <Text style={[styles.calTitle, { color: accent }]}>
              {selecting === 'from' ? '📅 Select Start Date' : '📅 Select End Date'}
            </Text>

            {/* Month navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
                <Text style={styles.navBtnText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>
                {MONTHS[calMonth]} {calYear}
              </Text>
              <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
                <Text style={styles.navBtnText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.dayHeaderRow}>
              {DAYS.map((d) => (
                <Text key={d} style={styles.dayHeader}>{d}</Text>
              ))}
            </View>

            {/* Calendar cells */}
            <View style={styles.grid}>
              {cells.map((day, idx) => {
                const sel = isSelected(day);
                const inRange = isInRange(day);
                const tod = isToday(day);

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.cell,
                      sel && [styles.cellSelected, { backgroundColor: accent }],
                      inRange && styles.cellInRange,
                      tod && !sel && styles.cellToday,
                    ]}
                    onPress={() => day && selectDay(day)}
                    disabled={!day}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.cellText,
                      sel && styles.cellTextSelected,
                      tod && !sel && [styles.cellTextToday, { color: accent }],
                      !day && styles.cellTextEmpty,
                    ]}>
                      {day ?? ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Current selection summary */}
            <View style={styles.selectionSummary}>
              <Text style={styles.selectionText}>
                {dateFrom ? `From: ${isoToDisplay(dateFrom)}` : 'From: Not selected'}
              </Text>
              <Text style={styles.selectionText}>
                {dateTo ? `To: ${isoToDisplay(dateTo)}` : 'To: Not selected'}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  onChangeDateFrom('');
                  onChangeDateTo('');
                  setVisible(false);
                }}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: accent }]}
                onPress={() => {
                  setVisible(false);
                  if (dateFrom || dateTo) onSearch();
                }}
              >
                <Text style={styles.applyBtnText}>Apply & Search</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },

  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  selectorBtn: {
    flex: 1, borderWidth: 1.5, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm, backgroundColor: COLORS.surface,
  },
  selectorBtnActive: { backgroundColor: COLORS.primaryLight },
  selectorLabel: { fontSize: 10, fontFamily: FONTS.semiBold, color: COLORS.textMuted, marginBottom: 2 },
  selectorValue: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.textSecondary },
  selectorArrow: { fontSize: 18, color: COLORS.textMuted, fontFamily: FONTS.bold },

  searchBtn: {
    borderRadius: BORDER_RADIUS.md, paddingVertical: 9,
    alignItems: 'center',
  },
  searchBtnText: { color: COLORS.white, fontFamily: FONTS.bold, fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  calendarCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, width: 340, maxWidth: '95%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 12,
  },
  calTitle: { fontSize: 16, fontFamily: FONTS.heavy, textAlign: 'center', marginBottom: SPACING.md },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  navBtnText: { fontSize: 20, fontFamily: FONTS.heavy, color: COLORS.text, lineHeight: 24 },
  monthLabel: { fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.text },

  dayHeaderRow: { flexDirection: 'row', marginBottom: 4 },
  dayHeader: {
    flex: 1, textAlign: 'center', fontSize: 11,
    fontFamily: FONTS.bold, color: COLORS.textMuted,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  cellSelected: { borderRadius: 20 },
  cellInRange: { backgroundColor: COLORS.primaryLight, borderRadius: 0 },
  cellToday: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 20 },
  cellText: { fontSize: 13, fontFamily: FONTS.medium, color: COLORS.text },
  cellTextSelected: { color: COLORS.white, fontFamily: FONTS.heavy },
  cellTextToday: { fontFamily: FONTS.heavy },
  cellTextEmpty: { color: 'transparent' },

  selectionSummary: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: SPACING.sm, paddingTop: SPACING.sm,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  selectionText: { fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },

  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  clearBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  clearBtnText: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  applyBtn: {
    flex: 2, paddingVertical: 10, alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  applyBtnText: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.white },
});

export default DateRangePicker;
