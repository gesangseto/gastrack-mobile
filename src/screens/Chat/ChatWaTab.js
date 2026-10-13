import Icon from '@react-native-vector-icons/lucide';
import {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import color from '../../constant/color';
import {
  createStaging,
  getWaChatCustomer,
  getWaChats,
  getWaMessages,
  markWaRead,
  sendWaReply,
} from '../../resource/WaChat';

// Format waktu pesan (detik epoch -> "HH:MM" atau "DD/MM").
const fmtTime = ts => {
  if (!ts) return '';
  const d = new Date(Number(ts) * 1000);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `${hh}:${mm}`;
  return `${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1,
  ).padStart(2, '0')}`;
};

// Tab "Chat WA" — daftar percakapan WhatsApp yang masuk ke nomor bisnis.
// Alur: pilih percakapan -> baca chat -> tap "Buat Item" -> item masuk Staging.
const ChatWaTab = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Thread yang sedang dibuka
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  // Modal "Buat Item"
  const [itemModal, setItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({item_name: '', quantity: '1'});
  const [itemSaving, setItemSaving] = useState(false);

  const loadChats = useCallback(async () => {
    setLoading(true);
    const data = await getWaChats(search ? {search} : {});
    setChats(data || []);
    setLoading(false);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats]),
  );

  const openChat = async chat => {
    setActiveChat(chat);
    setMsgLoading(true);
    const msgs = await getWaMessages(chat.jid);
    setMessages(msgs || []);
    setMsgLoading(false);
    // Tandai sudah dibaca (badge unread hilang setelah keluar-masuk).
    markWaRead(chat.jid);
    setChats(prev =>
      prev.map(c => (c.jid === chat.jid ? {...c, unread: 0} : c)),
    );
  };

  const closeChat = () => {
    setActiveChat(null);
    setMessages([]);
    setReply('');
    loadChats();
  };

  const handleSendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    const ok = await sendWaReply(activeChat.jid, reply.trim());
    if (ok) {
      setReply('');
      const msgs = await getWaMessages(activeChat.jid);
      setMessages(msgs || []);
    }
    setSending(false);
  };

  // Buka modal Buat Item — nomor HP & customer diambil dari chat.
  const openItemModal = async () => {
    const cust = await getWaChatCustomer(activeChat.jid);
    setItemForm({
      item_name: '',
      quantity: '1',
      phone: cust?.phone || activeChat.phone || '',
      customer_name: cust?.customer?.name || activeChat.push_name || '',
      customer_id: cust?.customer?.id || null,
    });
    setItemModal(true);
  };

  // Simpan ke staging (belum jadi item — admin lengkapi di tab Staging).
  const submitItem = async () => {
    if (!itemForm.item_name.trim()) return;
    setItemSaving(true);
    const lastMsg = messages.length ? messages[messages.length - 1] : null;
    const res = await createStaging({
      jid: activeChat.jid,
      wa_message_id: lastMsg?.message_id || null,
      raw_message: lastMsg?.text || null,
      customer_name: itemForm.customer_name || null,
      item_name: itemForm.item_name.trim(),
      quantity: Number(itemForm.quantity) || 1,
    });
    setItemSaving(false);
    if (res) {
      setItemModal(false);
      closeChat();
    }
  };

  // ===== Tampilan thread =====
  if (activeChat) {
    return (
      <View style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={closeChat} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={color.primaryColor} />
          </TouchableOpacity>
          <View style={styles.flex}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {activeChat.push_name || activeChat.phone || activeChat.jid}
            </Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {activeChat.phone || ''}
            </Text>
          </View>
          <TouchableOpacity onPress={openItemModal} style={styles.newItemBtn}>
            <Icon name="package-plus" size={16} color="#fff" />
            <Text style={styles.newItemText}>Buat Item</Text>
          </TouchableOpacity>
        </View>

        {msgLoading ? (
          <ActivityIndicator style={styles.center} color={color.primaryColor} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={m => String(m.message_id)}
            contentContainerStyle={styles.msgList}
            renderItem={({item}) => (
              <View
                style={[
                  styles.bubble,
                  item.from_me ? styles.bubbleOut : styles.bubbleIn,
                ]}>
                <Text style={item.from_me ? styles.textOut : styles.textIn}>
                  {item.text || `[${item.media_type || 'Pesan'}]`}
                </Text>
                <Text style={styles.bubbleTime}>{fmtTime(item.wa_timestamp)}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Belum ada pesan tersimpan.</Text>
            }
          />
        )}

        <View style={styles.replyRow}>
          <TextInput
            style={styles.replyInput}
            placeholder="Tulis balasan..."
            value={reply}
            onChangeText={setReply}
            multiline
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSendReply}
            disabled={sending}>
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Modal Buat Item */}
        <Modal visible={itemModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Buat Item dari Chat</Text>
              <Text style={styles.modalNote}>
                Item masuk ke <Text style={styles.bold}>Staging</Text> dulu.
                Lengkapi harga di tab Staging untuk jadikan Draft.
              </Text>

              <Text style={styles.label}>Nomor HP (dari chat)</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={itemForm.phone || '-'}
                editable={false}
              />

              <Text style={styles.label}>Customer</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={itemForm.customer_name || '(baru dari WA)'}
                editable={false}
              />

              <Text style={styles.label}>Nama Barang</Text>
              <TextInput
                style={styles.input}
                placeholder="cth: Tas hitam"
                value={itemForm.item_name}
                onChangeText={t => setItemForm(f => ({...f, item_name: t}))}
                autoFocus
              />

              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={itemForm.quantity}
                onChangeText={t => setItemForm(f => ({...f, quantity: t}))}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setItemModal(false)}>
                  <Text style={styles.cancelText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={submitItem}
                  disabled={itemSaving}>
                  {itemSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveText}>Simpan ke Staging</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ===== Tampilan daftar percakapan =====
  return (
    <View style={styles.flex}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Chat WhatsApp</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama atau nomor..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadChats}
        />
      </View>

      {loading && !chats.length ? (
        <ActivityIndicator style={styles.center} color={color.primaryColor} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={c => c.jid}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadChats} />
          }
          renderItem={({item}) => (
            <TouchableOpacity style={styles.chatRow} onPress={() => openChat(item)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.push_name || item.phone || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.chatName} numberOfLines={1}>
                  {item.push_name || item.phone || item.jid}
                </Text>
                <Text style={styles.chatPreview} numberOfLines={1}>
                  {item.last_from_me ? 'Anda: ' : ''}
                  {item.last_text || `[${item.last_media || 'Pesan'}]`}
                </Text>
              </View>
              <View style={styles.chatRight}>
                <Text style={styles.chatTime}>{fmtTime(item.last_ts)}</Text>
                {Number(item.unread) > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Belum ada chat tersimpan.{'\n'}Chat baru akan muncul di sini.
            </Text>
          }
        />
      )}
    </View>
  );
};

export default ChatWaTab;

const styles = StyleSheet.create({
  flex: {flex: 1},
  center: {marginTop: 40},
  bold: {fontWeight: '700'},

  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  listTitle: {fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8},
  searchInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
  },
  listContent: {paddingBottom: 90},

  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {fontSize: 18, fontWeight: '700', color: color.primaryColor},
  chatName: {fontSize: 15, fontWeight: '600', color: '#111'},
  chatPreview: {fontSize: 13, color: '#64748B', marginTop: 2},
  chatRight: {alignItems: 'flex-end', marginLeft: 8},
  chatTime: {fontSize: 11, color: '#94A3B8'},
  badge: {
    marginTop: 4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {color: '#fff', fontSize: 11, fontWeight: '700'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {padding: 6, marginRight: 4},
  headerTitle: {fontSize: 15, fontWeight: '700', color: '#111'},
  headerSub: {fontSize: 12, color: '#64748B'},
  newItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: color.primaryColor,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
  },
  newItemText: {color: '#fff', fontSize: 12, fontWeight: '700'},

  msgList: {padding: 14},
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  bubbleIn: {backgroundColor: '#F1F5F9', alignSelf: 'flex-start'},
  bubbleOut: {backgroundColor: color.primaryLight, alignSelf: 'flex-end'},
  textIn: {color: '#111', fontSize: 14},
  textOut: {color: '#111', fontSize: 14},
  bubbleTime: {fontSize: 10, color: '#94A3B8', marginTop: 3, alignSelf: 'flex-end'},

  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginBottom: 70,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {fontSize: 17, fontWeight: '700', color: '#111'},
  modalNote: {fontSize: 12.5, color: '#64748B', marginTop: 4, marginBottom: 12},
  label: {fontSize: 12.5, fontWeight: '600', color: '#334155', marginTop: 10},
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 5,
    fontSize: 14,
    color: '#111',
  },
  inputDisabled: {backgroundColor: '#F8FAFC', color: '#64748B'},
  modalActions: {flexDirection: 'row', gap: 10, marginTop: 20},
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {color: '#64748B', fontWeight: '600'},
  saveBtn: {
    flex: 1.4,
    height: 46,
    borderRadius: 10,
    backgroundColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {color: '#fff', fontWeight: '700'},

  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 50,
    fontSize: 14,
    lineHeight: 20,
  },
});
