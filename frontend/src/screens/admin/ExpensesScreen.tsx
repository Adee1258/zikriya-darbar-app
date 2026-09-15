import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  RefreshControl, Alert, ScrollView, Modal, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Expense, ExpenseCategory } from '../../types';
import { expensesAPI, paymentsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';
import Button from '../../components/Button';
import DateRangePicker from '../../components/DateRangePicker';

const CATEGORIES: ExpenseCategory[] = [
  'Petrol', 'Loading', 'Food', 'Repair', 'Salary', 'Rent', 'Utility', 'Other',
];

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Petrol: '⛽', Loading: '🚛', Food: '🍽️', Repair: '🔧',
  Salary: '💼', Rent: '🏠', Utility: '💡', Other: '📌',
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Petrol: '#F59E0B', Loading: '#6366F1', Food: '#10B981', Repair: '#EF4444',
  Salary: '#3B82F6', Rent: '#8B5CF6', Utility: '#EC4899', Other: '#94A3B8',
};

type FilterMode = 'all' | 'today' | 'week' | 'month' | 'custom';

// Format date as YYYY-MM-DD for input and API
const toISO = (d: Date) => d.toISOString().split('T')[0];
const today = () => toISO(new Date());

const ExpensesScreen = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0); // payments for same period
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [sharing, setSharing] = useState(false);

  // Add/Edit form state
  const [form, setForm] = useState({
    title: '', amount: '', category: 'Other' as ExpenseCategory,
    date: today(), notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async (
    mode: FilterMode = filterMode,
    from: string = dateFrom,
    to: string = dateTo,
  ) => {
    try {
      const expenseParams: Record<string, string> = {};
      const paymentParams: Record<string, string | number> = { limit: 500 };

      if (mode !== 'custom') {
        if (mode !== 'all') {
          expenseParams.filter = mode;
          paymentParams.filter = mode;
        }
      } else {
        if (from) { expenseParams.dateFrom = from; paymentParams.dateFrom = from; }
        if (to) { expenseParams.dateTo = to; paymentParams.dateTo = to; }
      }
      expenseParams.limit = '500';

      const [expRes, payRes] = await Promise.all([
        expensesAPI.getAll(expenseParams),
        paymentsAPI.getAll(paymentParams).catch(() => ({ data: { data: [] } })),
      ]);

      setExpenses(expRes.data.data || []);
      setTotalAmount(expRes.data.meta?.totalAmount ?? 0);

      const payData: Array<{ amount: number }> = payRes.data.data || [];
      setTotalCollected(payData.reduce((s, p) => s + p.amount, 0));
    } catch {
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterMode, dateFrom, dateTo]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleFilterChange = (mode: FilterMode) => {
    setFilterMode(mode);
    setLoading(true);
    loadData(mode, dateFrom, dateTo);
  };

  const handleCustomSearch = () => {
    if (!dateFrom && !dateTo) {
      Alert.alert('Error', 'Kam az kam ek date select karo');
      return;
    }
    setFilterMode('custom');
    setLoading(true);
    loadData('custom', dateFrom, dateTo);
  };

  // ── Category summary ──────────────────────────────────────────────────────
  const categorySummary = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    });
    return Array.from(map.entries())
      .map(([cat, total]) => ({ cat: cat as ExpenseCategory, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingExpense(null);
    setForm({ title: '', amount: '', category: 'Other', date: today(), notes: '' });
    setFormErrors({});
    setShowAddModal(true);
  };

  const openEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setForm({
      title: exp.title,
      amount: String(exp.amount),
      category: exp.category,
      date: exp.date.split('T')[0],
      notes: exp.notes || '',
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      e.amount = 'Valid amount required';
    if (!form.date) e.date = 'Date is required';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingExpense) {
        await expensesAPI.update(editingExpense._id, {
          title: form.title.trim(),
          amount: Number(form.amount),
          category: form.category,
          date: form.date,
          notes: form.notes.trim(),
        });
      } else {
        await expensesAPI.create({
          title: form.title.trim(),
          amount: Number(form.amount),
          category: form.category,
          date: form.date,
          notes: form.notes.trim(),
        });
      }
      setShowAddModal(false);
      loadData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save expense';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (exp: Expense) => {
    Alert.alert(
      '🗑️ Delete Expense',
      `"${exp.title}" (${formatCurrency(exp.amount)}) delete karna chahte hain?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await expensesAPI.delete(exp._id);
              setExpenses((prev) => prev.filter((e) => e._id !== exp._id));
              setTotalAmount((prev) => prev - exp.amount);
            } catch {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  // ── Download / Share ──────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (expenses.length === 0) {
      Alert.alert('No Data', 'Koi expense nahi hai download ke liye');
      return;
    }
    setSharing(true);
    try {
      const periodLabel =
        filterMode === 'today' ? 'Aaj'
          : filterMode === 'week' ? 'Is Hafte'
            : filterMode === 'month' ? 'Is Mahine'
              : filterMode === 'custom' ? `${dateFrom} to ${dateTo}`
                : 'All Time';

      let text = `💰 Zikriya Darbar — Expenses Report\n`;
      text += `📅 Period: ${periodLabel}\n`;
      text += `${'─'.repeat(40)}\n\n`;

      expenses.forEach((exp, i) => {
        text += `${i + 1}. ${CATEGORY_ICONS[exp.category]} ${exp.title}\n`;
        text += `   Category: ${exp.category}\n`;
        text += `   Amount:   ${formatCurrency(exp.amount)}\n`;
        text += `   Date:     ${formatDate(exp.date)}\n`;
        if (exp.notes) text += `   Notes:    ${exp.notes}\n`;
        text += '\n';
      });

      text += `${'─'.repeat(40)}\n`;
      text += `TOTAL EXPENSES: ${formatCurrency(totalAmount)}\n`;
      text += `CASH COLLECTED:  ${formatCurrency(totalCollected)}\n`;
      text += `NET CASH IN HAND: ${formatCurrency(totalCollected - totalAmount)}\n`;

      // Category breakdown
      if (categorySummary.length > 0) {
        text += `\nCategory Breakdown:\n`;
        categorySummary.forEach((c) => {
          text += `  ${CATEGORY_ICONS[c.cat]} ${c.cat}: ${formatCurrency(c.total)}\n`;
        });
      }

      await Share.share({ message: text, title: 'Expenses Report' });
    } catch {
      Alert.alert('Error', 'Share nahi ho saka');
    } finally {
      setSharing(false);
    }
  };

  if (loading) return <LoadingScreen message="Loading expenses..." />;

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryHeaderRow}>
          {/* Collected */}
          <View style={styles.summaryHeaderItem}>
            <Text style={styles.summaryHeaderLabel}>💳 Collected</Text>
            <Text style={[styles.summaryHeaderValue, { color: '#86efac' }]}>
              {formatCurrency(totalCollected)}
            </Text>
          </View>
          <Text style={styles.summaryHeaderOp}>−</Text>
          {/* Expenses */}
          <View style={styles.summaryHeaderItem}>
            <Text style={styles.summaryHeaderLabel}>💰 Expenses</Text>
            <Text style={[styles.summaryHeaderValue, { color: '#fca5a5' }]}>
              {formatCurrency(totalAmount)}
            </Text>
            <Text style={styles.summaryHeaderCount}>{expenses.length} entries</Text>
          </View>
          <Text style={styles.summaryHeaderOp}>=</Text>
          {/* Net Cash in Hand */}
          <View style={styles.summaryHeaderItem}>
            <Text style={styles.summaryHeaderLabel}>🤑 Cash in Hand</Text>
            <Text style={[
              styles.summaryHeaderValue,
              { color: totalCollected - totalAmount >= 0 ? '#86efac' : '#fca5a5' },
            ]}>
              {formatCurrency(totalCollected - totalAmount)}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={openAdd}>
          <Text style={styles.addHeaderBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Row */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterScroll} contentContainerStyle={styles.filterContent}
      >
        {(['today', 'week', 'month', 'all'] as FilterMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.filterBtn, filterMode === m && styles.filterBtnActive]}
            onPress={() => handleFilterChange(m)}
          >
            <Text style={[styles.filterBtnText, filterMode === m && styles.filterBtnTextActive]}>
              {m === 'today' ? 'Today' : m === 'week' ? 'This Week'
                : m === 'month' ? 'This Month' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterBtn, filterMode === 'custom' && styles.filterBtnActive]}
          onPress={() => setFilterMode('custom')}
        >
          <Text style={[styles.filterBtnText, filterMode === 'custom' && styles.filterBtnTextActive]}>
            📅 Custom
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom date range calendar picker */}
      {filterMode === 'custom' && (
        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          onChangeDateFrom={setDateFrom}
          onChangeDateTo={setDateTo}
          onSearch={handleCustomSearch}
          accentColor={COLORS.danger}
        />
      )}

      {/* Category Summary Pills */}
      {categorySummary.length > 0 && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.catScroll} contentContainerStyle={styles.catContent}
        >
          {categorySummary.map((c) => (
            <View key={c.cat} style={[styles.catPill, { borderColor: CATEGORY_COLORS[c.cat] }]}>
              <Text style={styles.catPillIcon}>{CATEGORY_ICONS[c.cat]}</Text>
              <View>
                <Text style={[styles.catPillName, { color: CATEGORY_COLORS[c.cat] }]}>{c.cat}</Text>
                <Text style={styles.catPillAmount}>{formatCurrency(c.total)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Download button */}
      {expenses.length > 0 && (
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} disabled={sharing}>
          <Text style={styles.downloadBtnText}>
            {sharing ? '⏳ Sharing...' : '📤 Download / Share Report'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Expense List */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
        ListEmptyComponent={
          <EmptyState icon="💰" title="Koi expense nahi" subtitle="+ Add button se naya expense add karo" />
        }
        renderItem={({ item }) => (
          <View style={styles.expenseCard}>
            <View style={[styles.catBar, { backgroundColor: CATEGORY_COLORS[item.category] }]} />
            <View style={styles.expenseBody}>
              <View style={styles.expenseTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.expenseTitle}>{item.title}</Text>
                  <View style={styles.catTagRow}>
                    <Text style={styles.catIcon}>{CATEGORY_ICONS[item.category]}</Text>
                    <Text style={[styles.catTag, { color: CATEGORY_COLORS[item.category] }]}>
                      {item.category}
                    </Text>
                    <Text style={styles.expenseDate}>• {formatDate(item.date)}</Text>
                  </View>
                  {item.notes ? <Text style={styles.expenseNotes}>{item.notes}</Text> : null}
                </View>
                <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
              </View>
              <View style={styles.expenseActions}>
                <TouchableOpacity style={styles.editChip} onPress={() => openEdit(item)}>
                  <Text style={styles.editChipText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteChip} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteChipText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExpense ? '✏️ Edit Expense' : '+ New Expense'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={[styles.input, formErrors.title && styles.inputError]}
                placeholder="e.g. Petrol for delivery"
                placeholderTextColor={COLORS.textMuted}
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              />
              {formErrors.title ? <Text style={styles.errorText}>{formErrors.title}</Text> : null}

              {/* Amount */}
              <Text style={styles.inputLabel}>Amount (Rs.) *</Text>
              <TextInput
                style={[styles.input, formErrors.amount && styles.inputError]}
                placeholder="e.g. 500"
                placeholderTextColor={COLORS.textMuted}
                value={form.amount}
                onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
                keyboardType="numeric"
              />
              {formErrors.amount ? <Text style={styles.errorText}>{formErrors.amount}</Text> : null}

              {/* Date */}
              <Text style={styles.inputLabel}>Date * (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.input, formErrors.date && styles.inputError]}
                placeholder="e.g. 2024-01-15"
                placeholderTextColor={COLORS.textMuted}
                value={form.date}
                onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
              />
              {formErrors.date ? <Text style={styles.errorText}>{formErrors.date}</Text> : null}

              {/* Category */}
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catBtn,
                      { borderColor: CATEGORY_COLORS[cat] },
                      form.category === cat && { backgroundColor: CATEGORY_COLORS[cat] },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, category: cat }))}
                  >
                    <Text style={styles.catBtnIcon}>{CATEGORY_ICONS[cat]}</Text>
                    <Text style={[
                      styles.catBtnText,
                      { color: form.category === cat ? COLORS.white : CATEGORY_COLORS[cat] },
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 60 }]}
                placeholder="Optional description..."
                placeholderTextColor={COLORS.textMuted}
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                multiline
              />

              <Button
                title={saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
                onPress={handleSave}
                loading={saving}
                style={{ marginTop: SPACING.md, marginBottom: SPACING.xl }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  summaryHeader: {
    backgroundColor: COLORS.danger,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  summaryHeaderRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
  },
  summaryHeaderItem: { flex: 1, alignItems: 'center' },
  summaryHeaderLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.75)',
    fontFamily: FONTS.semiBold, textAlign: 'center', marginBottom: 2,
  },
  summaryHeaderValue: { fontSize: 13, fontFamily: FONTS.heavy, textAlign: 'center' },
  summaryHeaderCount: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1, textAlign: 'center' },
  summaryHeaderOp: {
    fontSize: 16, fontFamily: FONTS.heavy, color: 'rgba(255,255,255,0.5)', marginHorizontal: 2,
  },
  addHeaderBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  addHeaderBtnText: { color: COLORS.white, fontFamily: FONTS.heavy, fontSize: 15 },

  filterScroll: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterContent: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterBtnActive: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  filterBtnText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  filterBtnTextActive: { color: COLORS.white },

  catScroll: { maxHeight: 68, backgroundColor: COLORS.white },
  catContent: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round, borderWidth: 1.5,
    backgroundColor: COLORS.white,
  },
  catPillIcon: { fontSize: 16 },
  catPillName: { fontSize: 11, fontFamily: FONTS.bold },
  catPillAmount: { fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.text },

  downloadBtn: {
    margin: SPACING.md, marginBottom: 0,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.sm,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  downloadBtnText: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.primary },

  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  expenseCard: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm,
    overflow: 'hidden', ...SHADOWS.xs,
    borderWidth: 1, borderColor: COLORS.border,
  },
  catBar: { width: 5 },
  expenseBody: { flex: 1, padding: SPACING.md },
  expenseTop: { flexDirection: 'row', marginBottom: SPACING.xs },
  expenseTitle: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 3 },
  catTagRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  catIcon: { fontSize: 13 },
  catTag: { fontSize: 11, fontFamily: FONTS.bold },
  expenseDate: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted },
  expenseNotes: {
    fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted,
    marginTop: 3, fontStyle: 'italic',
  },
  expenseAmount: { fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.danger },
  expenseActions: { flexDirection: 'row', gap: SPACING.sm },
  editChip: {
    flex: 1, paddingVertical: 5, alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  editChipText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  deleteChip: {
    flex: 1, paddingVertical: 5, alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)',
    backgroundColor: COLORS.dangerLight,
  },
  deleteChipText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.danger },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SPACING.lg, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: { fontSize: 18, fontFamily: FONTS.heavy, color: COLORS.text },
  modalClose: { fontSize: 20, color: COLORS.textMuted, fontFamily: FONTS.bold, padding: 4 },

  inputLabel: {
    fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text, marginBottom: 4, marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    fontSize: 14, fontFamily: FONTS.medium, color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  inputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 11, fontFamily: FONTS.medium, color: COLORS.danger, marginTop: 2 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xs },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1.5,
  },
  catBtnIcon: { fontSize: 14 },
  catBtnText: { fontSize: 12, fontFamily: FONTS.bold },
});

export default ExpensesScreen;
