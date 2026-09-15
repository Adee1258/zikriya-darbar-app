import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AdminStackParamList, VisitDay } from '../../types';
import { marketsAPI } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';

type EditRoute = RouteProp<AdminStackParamList, 'EditMarket'>;

const VISIT_DAYS: VisitDay[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday', 'None',
];

const DAY_COLORS: Record<string, string> = {
  Monday:    '#6366F1',
  Tuesday:   '#F59E0B',
  Wednesday: '#10B981',
  Thursday:  '#3B82F6',
  Friday:    '#EF4444',
  Saturday:  '#8B5CF6',
  Sunday:    '#EC4899',
  None:      '#94A3B8',
};

// This screen handles both Add and Edit — route params determine mode
const AddEditMarketScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Detect if we're in edit mode by checking if route has marketId param
  const editParams = (route.params as AdminStackParamList['EditMarket'] | undefined);
  const isEdit = !!editParams?.marketId;
  const marketId = editParams?.marketId;

  const [name, setName] = useState('');
  const [visitDay, setVisitDay] = useState<VisitDay>('None');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isEdit && marketId) {
      marketsAPI.getById(marketId)
        .then((res) => {
          const m = res.data.data;
          setName(m.name);
          setVisitDay(m.visitDay);
          setDescription(m.description || '');
        })
        .catch(() => {
          Alert.alert('Error', 'Failed to load market');
          navigation.goBack();
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, marketId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Market name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit && marketId) {
        await marketsAPI.update(marketId, { name: name.trim(), visitDay, description: description.trim() });
        Alert.alert('Success ✅', 'Market updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await marketsAPI.create({ name: name.trim(), visitDay, description: description.trim() });
        Alert.alert('Success ✅', 'Market created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save market';
      Alert.alert('Error ❌', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!isEdit || !marketId) return;
    Alert.alert(
      '⚠️ Delete Market',
      `"${name}" market ko delete karna chahte hain?\n\nNote: Agar is market mein shops hain toh delete nahi hoga.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await marketsAPI.delete(marketId);
              Alert.alert('Deleted', 'Market deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: unknown) {
              const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Failed to delete market';
              Alert.alert('Error ❌', msg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Input
          label="Market Name *"
          placeholder="e.g. Lahore Market, Gujranwala Market"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        {/* Visit Day Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Visit Day</Text>
          <Text style={styles.fieldHint}>Kaunse din aap is market mein jaate hain?</Text>
          <View style={styles.daysGrid}>
            {VISIT_DAYS.map((day) => {
              const active = visitDay === day;
              const color = DAY_COLORS[day];
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayBtn,
                    { borderColor: color },
                    active && { backgroundColor: color },
                  ]}
                  onPress={() => setVisitDay(day)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayBtnText, { color: active ? COLORS.white : color }]}>
                    {day === 'None' ? '—' : day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {visitDay !== 'None' && (
            <View style={[styles.selectedDayBadge, { backgroundColor: `${DAY_COLORS[visitDay]}18` }]}>
              <Text style={[styles.selectedDayText, { color: DAY_COLORS[visitDay] }]}>
                ✓ Visit day: {visitDay}
              </Text>
            </View>
          )}
        </View>

        <Input
          label="Description (Optional)"
          placeholder="e.g. City area, north side markets..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Button
          title={saving ? 'Saving...' : isEdit ? 'Update Market' : 'Create Market'}
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />

        {isEdit && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Text style={styles.deleteBtnText}>
              {deleting ? 'Deleting...' : '🗑️  Delete This Market'}
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  fieldGroup: { marginBottom: SPACING.md },
  fieldLabel: {
    fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text, marginBottom: 2,
  },
  fieldHint: {
    fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginBottom: SPACING.sm,
  },

  daysGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
  },
  dayBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1.5,
    minWidth: 54, alignItems: 'center',
  },
  dayBtnText: { fontSize: 12, fontFamily: FONTS.bold },

  selectedDayBadge: {
    marginTop: SPACING.sm, padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  selectedDayText: { fontSize: 13, fontFamily: FONTS.semiBold },

  saveBtn: { marginTop: SPACING.sm },
  deleteBtn: {
    marginTop: SPACING.md, padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg, alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)',
  },
  deleteBtnText: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.danger },
});

export default AddEditMarketScreen;
