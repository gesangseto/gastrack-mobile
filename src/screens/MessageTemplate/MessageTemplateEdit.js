import {useFocusEffect} from '@react-navigation/native';
import {useCallback, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import InputText from '../../components/InputText';
import LoadingButton from '../../components/LoadingButton';
import useSubmitGuard from '../../hooks/useSubmitGuard';
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {
  createMessageTemplate,
  getListTemplateVariable,
  updateMessageTemplate,
} from '../../resource/MessageTemplate';

// Formatasi contoh nilai mengikuti `data_type` di mst_template_variable.
// Mengg-logic yang sama dengan services/template-renderer.js di backend agar
// contoh di Android cocok dengan hasil render sebenarnya.
const formatSample = (value, dataType) => {
  if (value === undefined || value === null || value === '') return '-';
  const num = Number(value);
  switch (dataType) {
    case 'currency':
      return Number.isNaN(num)
        ? String(value)
        : 'Rp ' + num.toLocaleString('id-ID');
    case 'number':
      return Number.isNaN(num) ? String(value) : num.toLocaleString('id-ID');
    case 'date': {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    default:
      return String(value);
  }
};

const CHANNEL_OPTIONS = ['wa', 'email', 'sms'];
const CONTENT_TYPE_OPTIONS = ['text', 'html'];
const RECIPIENT_TYPE_OPTIONS = ['customer', 'all', 'segment'];
const STATUS_OPTIONS = ['Active', 'Inactive'];

// Form Template.
// - Field `code` READ-ONLY (kunci unik, dibuat dari Website/seeder).
// - Field lain tetap bisa diubah user.
// - Tidak ada hapus di Android (hapus hanya dari Website).
const MessageTemplateEdit = ({route}) => {
  const isEdit = !!route?.params?.item;
  const [formData, setFormData] = useState({
    id: null,
    code: '',
    name: '',
    channel: 'wa',
    content_template: '',
    description: '',
    subject: '',
    content_type: 'text',
    trigger_event: '',
    recipient_type: 'customer',
    status: 'Active',
  });
  // Guard anti-duplikat submit (ref lock sinkron + status untuk tombol)
  const {busy: saving, submit} = useSubmitGuard();
  const [variables, setVariables] = useState([]);

  useFocusEffect(
    useCallback(() => {
      getListTemplateVariable({}, false).then(res => {
        if (Array.isArray(res)) {
          setVariables(res);
        }
      });
      if (route?.params?.item) {
        const item = route.params.item;
        setFormData({
          id: item.id || null,
          code: item.code || '',
          name: item.name || '',
          channel: item.channel || 'wa',
          content_template: item.content_template || '',
          description: item.description || '',
          subject: item.subject || '',
          content_type: item.content_type || 'text',
          trigger_event: item.trigger_event || '',
          recipient_type: item.recipient_type || 'customer',
          status: item.status || 'Active',
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const setField = (key, value) => {
    setFormData(prev => ({...prev, [key]: value}));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.content_template) {
      return;
    }
    await submit(async () => {
      const payload = {
        code: formData.code,
        name: formData.name,
        channel: formData.channel,
        content_template: formData.content_template,
        description: formData.description || null,
        subject: formData.subject || null,
        content_type: formData.content_type,
        trigger_event: formData.trigger_event || null,
        recipient_type: formData.recipient_type,
        status: formData.status,
      };
      const response = isEdit
        ? await updateMessageTemplate({id: formData.id, ...payload})
        : await createMessageTemplate(payload);
      if (response) {
        RootNavigation.goBack();
      }
    });
  };

  const insertVariable = key => {
    setField('content_template', (formData.content_template || '') + `{{${key}}}`);
  };

  const renderChipGroup = (label, options, selectedKey) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            onPress={() => setField(selectedKey, opt)}
            style={[
              styles.chip,
              formData[selectedKey] === opt && styles.chipActive,
            ]}>
            <Text
              style={[
                styles.chipText,
                formData[selectedKey] === opt && styles.chipTextActive,
              ]}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title={isEdit ? 'Edit Template' : 'Tambah Template'} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{paddingBottom: 60}}>
        <InputText
          label="Code"
          required={true}
          value={formData.code}
          editable={false}
          placeholder="REQUEST_PAYMENT"
        />
        <InputText
          label="Nama"
          required={true}
          value={formData.name}
          onChangeText={text => setField('name', text)}
          placeholder="Nama template"
        />
        <InputText
          label="Trigger Event"
          value={formData.trigger_event}
          onChangeText={text => setField('trigger_event', text)}
          placeholder="request_payment"
          autoCapitalize="none"
        />
        {renderChipGroup('Channel', CHANNEL_OPTIONS, 'channel')}
        {renderChipGroup('Content Type', CONTENT_TYPE_OPTIONS, 'content_type')}
        {renderChipGroup(
          'Recipient Type',
          RECIPIENT_TYPE_OPTIONS,
          'recipient_type',
        )}
        <InputText
          label="Subject (Email)"
          value={formData.subject}
          onChangeText={text => setField('subject', text)}
          placeholder="Email subject line"
        />
        <InputText
          label="Deskripsi"
          value={formData.description}
          onChangeText={text => setField('description', text)}
          placeholder="Deskripsi template"
          multiline={true}
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Content Template */}
        <Text style={styles.label}>
          Content Template <Text style={styles.required}>*</Text>
        </Text>
        <InputText
          value={formData.content_template}
          onChangeText={text => setField('content_template', text)}
          placeholder="Tulis isi pesan. Placeholder diisi otomatis saat kirim."
          multiline={true}
          numberOfLines={8}
          textAlignVertical="top"
          style={styles.contentInput}
        />
        <Text style={styles.hint}>
          Placeholder ditulis dengan kurung kurawal ganda, contoh{' '}
          {'{{customer_name}}'}. Nilai placeholder diisi otomatis saat pesan
          dikirim. Daftar variabel yang tersedia ada di bawah — tap untuk
          menyisipkannya.
        </Text>

        {/* Daftar variabel beserta contoh nilainya. */}
        {variables.length > 0 && (
          <>
            <Text style={styles.label}>
              Variabel tersedia ({variables.length})
            </Text>
            <View style={styles.varWrap}>
              {variables.map(v => (
                <TouchableOpacity
                  key={v.key}
                  onPress={() => insertVariable(v.key)}
                  style={styles.varChip}
                  accessibilityRole="button"
                  accessibilityLabel={`Sisipkan ${v.label || v.key}`}>
                  <View style={styles.varChipHead}>
                    <Text style={styles.varChipKey}>{`{{${v.key}}}`}</Text>
                    {!!v.label && (
                      <Text style={styles.varChipLabel}>{v.label}</Text>
                    )}
                  </View>
                  <Text style={styles.varChipSample} numberOfLines={1}>
                    Contoh: {formatSample(v.sample_value, v.data_type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {renderChipGroup('Status', STATUS_OPTIONS, 'status')}

        <LoadingButton
          onPress={handleSave}
          busy={saving}
          label="Simpan"
          busyLabel="Menyimpan..."
          icon="check"
          style={styles.saveButton}
        />
      </ScrollView>
    </View>
  );
};

export default MessageTemplateEdit;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.white,
  },
  container: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 30,
    paddingTop: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },
  required: {
    color: '#EF4444',
  },
  hint: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: color.primaryLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: color.primaryColor,
    borderColor: color.primaryColor,
  },
  chipText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: color.white,
  },
  contentInput: {
    fontSize: 14,
    // Harus sama dengan asumsi lineHeight di InputText (22px/baris) agar
    // tinggi minimum field pas dengan jumlah baris yang ditampilkan.
    lineHeight: 22,
  },
  varWrap: {
    marginBottom: 14,
  },
  varChip: {
    // Lebar penuh satu baris supaya contoh nilai tidak terpotong.
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 6,
  },
  varChipHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  varChipKey: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '700',
  },
  varChipLabel: {
    flex: 1,
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
    textAlign: 'right',
  },
  varChipSample: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  saveButton: {
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: color.primaryColor,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  saveButtonText: {
    color: color.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
