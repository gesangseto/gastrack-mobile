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
import * as RootNavigation from '../../config/RootNavigation';
import color from '../../constant/color';
import Header from '../../layouts/Header';
import {
  createMessageTemplate,
  getListTemplateVariable,
  updateMessageTemplate,
} from '../../resource/MessageTemplate';

const CHANNEL_OPTIONS = ['wa', 'email', 'sms'];
const CONTENT_TYPE_OPTIONS = ['text', 'html'];
const RECIPIENT_TYPE_OPTIONS = ['customer', 'all', 'segment'];
const STATUS_OPTIONS = ['Active', 'Inactive'];

const MessageTemplateEdit = ({navigation, route}) => {
  // Tanpa param `item` = mode tambah template baru.
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
  const [saving, setSaving] = useState(false);
  const [variables, setVariables] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadVariables();
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

  const loadVariables = async () => {
    const res = await getListTemplateVariable({}, false);
    if (res && Array.isArray(res)) {
      setVariables(res);
    }
  };

  const setField = (key, value) => {
    setFormData(prev => ({...prev, [key]: value}));
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.content_template) {
      return;
    }
    setSaving(true);
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
    let response = isEdit
      ? await updateMessageTemplate({id: formData.id, ...payload})
      : await createMessageTemplate(payload);
    setSaving(false);
    if (response) {
      RootNavigation.goBack();
    }
  };

  const insertVariable = key => {
    const token = `{{${key}}}`;
    setField('content_template', (formData.content_template || '') + token);
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
    <View style={{flex: 1, backgroundColor: color.white}}>
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
          onChangeText={text => setField('code', text)}
          placeholder="REQUEST_PAYMENT"
          autoCapitalize="characters"
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
          placeholder="Masukkan template dengan {{variable}}"
          multiline={true}
          numberOfLines={6}
          textAlignVertical="top"
          style={styles.contentInput}
        />
        <Text style={styles.hint}>
          Gunakan {'{{variable}}'} untuk placeholder. Contoh:{' '}
          {'{{customer_name}}'}, {'{{order_number}}'}, {'{{amount}}'}
        </Text>

        {/* Variable picker */}
        {variables.length > 0 && (
          <>
            <Text style={styles.label}>Sisipkan Variabel</Text>
            <View style={styles.varWrap}>
              {variables.map(v => (
                <TouchableOpacity
                  key={v.key}
                  onPress={() => insertVariable(v.key)}
                  style={styles.varChip}>
                  <Text style={styles.varChipText}>{v.key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {renderChipGroup('Status', STATUS_OPTIONS, 'status')}

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveButton}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default MessageTemplateEdit;

const styles = StyleSheet.create({
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
    lineHeight: 20,
  },
  varWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  varChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  varChipText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '500',
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
