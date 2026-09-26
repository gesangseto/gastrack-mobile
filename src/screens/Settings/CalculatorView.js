import {useCallback, useEffect, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from '@react-native-vector-icons/lucide';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {fetchSysConfig} from '../../resource/Configuration';
import {getSysConfig} from '../../storage';
import {useCalculatorStore} from '../../store/calculatorStore';
import {useSessionStore} from '../../store/sessionStore';

const DEFAULT_ORIGIN_CURRENCY = 'IDR';

// Format angka ribuan (id-ID) + maks 2 desimal
const formatNum = v => {
  if (v == null || !Number.isFinite(v)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(v);
};

const CalculatorView = () => {
  // Session aktif (default currency tujuan), dari store (sudah di-cache).
  const activeSession = useSessionStore(s => s.activeSession);
  const fetchActiveSession = useSessionStore(s => s.fetchActiveSession);

  // Pastikan activeSession terisi kalau app baru start (store masih kosong).
  useEffect(() => {
    if (!activeSession) {
      fetchActiveSession();
    }
  }, [activeSession, fetchActiveSession]);

  // Default currency asal: dari sys_configuration (cache MMKV / fetch fresh).
  const [defaultOrigin, setDefaultOrigin] = useState(
    getSysConfig()?.currency || DEFAULT_ORIGIN_CURRENCY,
  );

  useFocusEffect(
    useCallback(() => {
      fetchSysConfig().then(conf => {
        if (conf?.currency) {
          setDefaultOrigin(conf.currency);
        }
      });
    }, []),
  );

  // Markup dari store (default 20%), persist ke MMKV.
  const markupStore = useCalculatorStore(s => s.markup);
  const setMarkupStore = useCalculatorStore(s => s.setMarkup);
  const resetMarkupStore = useCalculatorStore(s => s.resetMarkup);

  // ===== Form state =====
  const [price, setPrice] = useState('');
  const [destCode, setDestCode] = useState('');
  const [originCode, setOriginCode] = useState(defaultOrigin);
  const [rate, setRate] = useState('');

  // Sinkronkan default dari session aktif (currency tujuan + rate) saat berubah.
  useEffect(() => {
    if (activeSession) {
      if (activeSession.currency_code) {
        setDestCode(activeSession.currency_code);
      }
      if (activeSession.currency) {
        setRate(String(Number(activeSession.currency)));
      }
    } else {
      setDestCode('');
      setRate('');
    }
  }, [activeSession]);

  // Sinkronkan default currency asal dari sys_configuration.
  useEffect(() => {
    setOriginCode(defaultOrigin);
  }, [defaultOrigin]);

  // Info untuk label (negara session aktif)
  const destLabel = activeSession?.country
    ? `${destCode || '?'} · ${activeSession.country}`
    : destCode || '?';

  // ===== Perhitungan =====
  const priceNum = Number(price);
  const rateNum = Number(rate);
  const markupNum = Number(markupStore); // dari zustand store (default 20)

  const hasPrice = Number.isFinite(priceNum) && priceNum > 0;
  const hasRate = Number.isFinite(rateNum) && rateNum > 0;
  const hasMarkup = Number.isFinite(markupNum) && markupNum > 0;

  // Harga dalam currency tujuan → currency asal
  const converted = hasPrice && hasRate ? priceNum * rateNum : null;
  // Markup (dalam currency asal)
  const markupValue =
    converted != null && hasMarkup ? converted * (markupNum / 100) : null;
  // Harga final setelah markup
  const finalPrice =
    converted != null && hasMarkup ? converted + markupValue : null;

  // Quick-fill dari session aktif
  const fillFromSession = () => {
    if (!activeSession) return;
    const r = activeSession.currency;
    if (r) setRate(String(Number(r)));
    if (activeSession.currency_code) {
      setDestCode(activeSession.currency_code);
    }
  };

  // Reset semua input (kecuali default currency)
  const resetAll = () => {
    setPrice('');
    setRate(
      activeSession?.currency ? String(Number(activeSession.currency)) : '',
    );
    setDestCode(activeSession?.currency_code || '');
    setOriginCode(defaultOrigin);
    resetMarkupStore(); // markup balik ke default 20%
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="Calculator" />
      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          {/* ===== Hero ===== */}
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <Icon name="calculator" size={22} color={color.white} />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>Kalkulator Harga Jastip</Text>
              <Text style={styles.heroDesc}>
                Konversi harga + markup otomatis untuk titip belanja
              </Text>
            </View>
          </View>

          {/* ===== Info default ===== */}
          <View style={styles.infoRow}>
            <View style={styles.infoChip}>
              <Icon name="target" size={13} color={color.primaryColor} />
              <Text style={styles.infoChipText}>Tujuan: {destLabel}</Text>
            </View>
            <View style={styles.infoChip}>
              <Icon name="house" size={13} color={color.primaryColor} />
              <Text style={styles.infoChipText}>Asal: {originCode || '?'}</Text>
            </View>
          </View>

          {/* ===== Hasil utama (live) ===== */}
          <View style={styles.resultHero}>
            <Text style={styles.resultHeroLabel}>Harga Jual Setelah Markup</Text>
            <Text style={styles.resultHeroValue}>{formatNum(finalPrice)}</Text>
            <Text style={styles.resultHeroCurrency}>{originCode || '?'}</Text>
            {converted != null && (
              <View style={styles.resultHeroBreakdown}>
                <Text style={styles.resultHeroBreakdownText}>
                  {formatNum(converted)} {originCode} + markup{' '}
                  {hasMarkup ? `${markupNum}%` : '0%'} ={' '}
                  {formatNum(markupValue || 0)} {originCode}
                </Text>
              </View>
            )}
          </View>

          {/* ===== Input harga ===== */}
          <Text style={styles.sectionTitle}>Input Harga</Text>
          <View style={styles.inputCard}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Harga Barang</Text>
              <Text style={styles.inputUnit}>{destCode || '?'}</Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                placeholderTextColor="#C4C4CE"
                keyboardType="decimal-pad"
              />
              {price !== '' && (
                <TouchableOpacity onPress={() => setPrice('')}>
                  <Icon name="x" size={16} color="#C4C4CE" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ===== Currency & rate ===== */}
          <Text style={styles.sectionTitle}>Konversi Mata Uang</Text>
          <View style={styles.convertRow}>
            {/* Tujuan */}
            <View style={styles.convertBox}>
              <Text style={styles.inputLabel}>Currency Tujuan</Text>
              <TextInput
                style={styles.convertInput}
                value={destCode}
                onChangeText={setDestCode}
                placeholder="THB"
                placeholderTextColor="#C4C4CE"
                autoCapitalize="characters"
              />
              <Text style={styles.convertSub}>
                {activeSession ? 'Session aktif' : 'Manual'}
              </Text>
            </View>

            {/* Arrow */}
            <View style={styles.convertArrow}>
              <Icon name="arrow-right" size={18} color={color.secondaryColor} />
            </View>

            {/* Asal */}
            <View style={styles.convertBox}>
              <Text style={styles.inputLabel}>Currency Asal</Text>
              <TextInput
                style={styles.convertInput}
                value={originCode}
                onChangeText={setOriginCode}
                placeholder="IDR"
                placeholderTextColor="#C4C4CE"
                autoCapitalize="characters"
              />
              <Text style={styles.convertSub}>Sys Configuration</Text>
            </View>
          </View>

          {/* Rate */}
          <View style={styles.inputCard}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Rate Currency</Text>
              <Text style={styles.inputUnit}>
                1 {destCode || '?'} = X {originCode || '?'}
              </Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={rate}
                onChangeText={setRate}
                placeholder="0"
                placeholderTextColor="#C4C4CE"
                keyboardType="decimal-pad"
              />
              {activeSession && (
                <TouchableOpacity onPress={fillFromSession}>
                  <Text style={styles.fillBtn}>Isi dari session</Text>
                </TouchableOpacity>
              )}
            </View>
            {activeSession && (
              <Text style={styles.inputSub}>
                Default: {Number(activeSession.currency)} (session aktif)
              </Text>
            )}
          </View>

          {/* ===== Markup ===== */}
          <Text style={styles.sectionTitle}>Markup Harga</Text>
          <View style={styles.markupRow}>
            <View style={styles.markupBox}>
              <Text style={styles.inputLabel}>Markup (%)</Text>
              <TextInput
                style={styles.markupInput}
                value={markupStore ? String(markupStore) : ''}
                onChangeText={v => setMarkupStore(v)}
                placeholder="20"
                placeholderTextColor="#C4C4CE"
                keyboardType="decimal-pad"
              />
              <Text style={styles.markupHint}>
                Default 20% · tersimpan
              </Text>
            </View>
            <View style={styles.markupPreview}>
              <Text style={styles.markupPreviewLabel}>Tambahan</Text>
              <Text style={styles.markupPreviewValue}>
                {formatNum(markupValue)}
              </Text>
              <Text style={styles.markupPreviewCurrency}>
                {originCode || '?'}
              </Text>
            </View>
          </View>

          {/* ===== Ringkasan ===== */}
          {converted != null && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryRowItem}>
                <Text style={styles.summaryLabel}>Harga asli</Text>
                <Text style={styles.summaryValue}>
                  {formatNum(converted)} {originCode}
                </Text>
              </View>
              {hasMarkup && (
                <View style={styles.summaryRowItem}>
                  <Text style={styles.summaryLabel}>Markup {markupNum}%</Text>
                  <Text style={styles.summaryValue}>
                    +{formatNum(markupValue)} {originCode}
                  </Text>
                </View>
              )}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRowItem}>
                <Text style={styles.summaryLabelFinal}>Harga jual final</Text>
                <Text style={styles.summaryValueFinal}>
                  {formatNum(finalPrice)} {originCode}
                </Text>
              </View>
            </View>
          )}

          {/* ===== Aksi ===== */}
          <TouchableOpacity onPress={resetAll} style={styles.resetBtn}>
            <Icon name="rotate-ccw" size={16} color="#9A9A9A" />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

export default CalculatorView;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: color.white,
  },
  body: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Hero
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.primaryColor,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: color.white,
    fontSize: 16,
    fontWeight: '700',
  },
  heroDesc: {
    color: '#C9BCE8',
    fontSize: 12,
    marginTop: 2,
  },
  // Info chips
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: color.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flex: 1,
  },
  infoChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A4A4A',
    flexShrink: 1,
  },
  // Result hero
  resultHero: {
    backgroundColor: color.primaryColor,
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    alignItems: 'center',
  },
  resultHeroLabel: {
    color: '#C9BCE8',
    fontSize: 12,
    fontWeight: '600',
  },
  resultHeroValue: {
    color: color.white,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 4,
  },
  resultHeroCurrency: {
    color: color.white,
    fontSize: 15,
    fontWeight: '600',
    marginTop: -2,
  },
  resultHeroBreakdown: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  resultHeroBreakdownText: {
    color: '#C9BCE8',
    fontSize: 11,
  },
  // Section title
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B8B93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  // Input card
  inputCard: {
    backgroundColor: '#F8F8FC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B73',
  },
  inputUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: color.primaryColor,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F1F1F',
    paddingVertical: 8,
  },
  inputSub: {
    fontSize: 11,
    color: '#9A9A9A',
    marginBottom: 10,
  },
  fillBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: color.primaryColor,
  },
  // Convert row
  convertRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  convertBox: {
    flex: 1,
    backgroundColor: '#F8F8FC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  convertInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F1F',
    paddingVertical: 4,
  },
  convertSub: {
    fontSize: 10,
    color: '#9A9A9A',
  },
  convertArrow: {
    paddingBottom: 12,
  },
  // Markup
  markupRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  markupBox: {
    flex: 1,
    backgroundColor: '#F8F8FC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  markupInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F1F1F',
    paddingVertical: 4,
  },
  markupHint: {
    fontSize: 10,
    color: '#9A9A9A',
    marginTop: 2,
  },
  markupPreview: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  markupPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C4843E',
  },
  markupPreviewValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
    marginTop: 4,
  },
  markupPreviewCurrency: {
    fontSize: 10,
    color: '#C4843E',
  },
  // Summary
  summaryCard: {
    backgroundColor: color.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  summaryRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B6B73',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F1F1F',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E3E1EC',
    marginVertical: 8,
  },
  summaryLabelFinal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F1F1F',
  },
  summaryValueFinal: {
    fontSize: 16,
    fontWeight: '800',
    color: color.primaryColor,
  },
  // Reset
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9A9A9A',
  },
});
