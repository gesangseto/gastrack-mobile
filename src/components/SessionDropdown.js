import {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import color from '../constant/color';
import {useSessionStore} from '../store/sessionStore';

/**
 * SessionDropdown — picker session jastip yang dipakai Home
 * (dan menu lain yang butuh ganti session cepat).
 *
 * Sumber data & state:
 *  - `sessionList`     : daftar session dari `useSessionStore` (cache MMKV,
 *                        diisi oleh `initSessionListFromCache`/`fetchSessionList`).
 *  - `selectedSession` : session terpilih, PERSIST ke MMKV lewat
 *                        `selectSession()` — ini satu-satunya sumber filter
 *                        seluruh app (Home/Statistik/Item/Batch/Payment).
 *                        Default = session aktif (di-set oleh store saat
 *                        daftar session pertama kali dimuat).
 *
 * Catatan penting:
 *  - `items` WAJIB di-memoize. DropDownPicker v5 memanggil `onChangeValue`
 *    setiap kali referensi `items` berubah; array inline yang dibuat ulang
 *    tiap render memicu loop tak berujung (selectSession → render →
 *    items baru → onChangeValue → ...).
 *  - `setValue` dari DropDownPicker bisa menerima FUNGSI (state => newValue),
 *    jadi selalu evaluasi dulu sebelum dipakai.
 *  - `onChange` laporan ke parent SESUDAH store ter-update, agar parent bisa
 *    bereaksi tanpa ikut memanggil `selectSession` lagi.
 */

const SessionDropdown = ({
  open,
  onToggle,
  onChange,
  placeholder = 'Pilih session jastip',
  searchable = true,
  style,
}) => {
  const sessionList = useSessionStore(s => s.sessionList);
  const setSessionList = useSessionStore(s => s.setSessionList);
  const selectedSession = useSessionStore(s => s.selectedSession);
  const selectSession = useSessionStore(s => s.selectSession);

  // Value dropdown = id session terpilih (null bila belum ada pilihan).
  const sessionValue = selectedSession ? selectedSession.id : null;

  const sessionItems = useMemo(
    () => [
      ...sessionList.map(s => ({
        label: `${s.session_no} • ${s.country || '-'} (${s.status})`,
        value: s.id,
      })),
    ],
    [sessionList],
  );

  const handleSelectSession = value => {
    const id = typeof value === 'function' ? value(sessionValue) : value;
    const session = sessionList.find(s => s.id === id) || null;
    if (!session) {
      return;
    }
    const changed = !selectedSession || selectedSession.id !== session.id;
    selectSession(session);
    if (changed && typeof onChange === 'function') {
      onChange(session);
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      <DropDownPicker
        open={open}
        value={sessionValue}
        items={sessionItems}
        setOpen={onToggle}
        setValue={handleSelectSession}
        setItems={setSessionList}
        placeholder={placeholder}
        style={styles.picker}
        dropDownContainerStyle={styles.pickerDropdown}
        listMode="MODAL"
        modalAnimationType="slide"
        modalContentContainerStyle={styles.pickerModal}
        searchable={searchable}
        searchPlaceholder="Cari session..."
        searchContainerStyle={styles.pickerSearchContainer}
        searchTextInputStyle={styles.pickerSearchInput}
        searchPlaceholderTextColor="#9CA3AF"
        textStyle={styles.pickerText}
        labelStyle={styles.pickerLabel}
        placeholderStyle={styles.pickerPlaceholder}
        arrowIconStyle={styles.pickerArrow}
        tickIconStyle={styles.pickerTick}
        listItemContainerStyle={styles.pickerListItem}
        listItemLabelStyle={styles.pickerListItemLabel}
        selectedItemContainerStyle={styles.pickerSelectedItem}
        selectedItemLabelStyle={styles.pickerSelectedLabel}
        itemSeparatorStyle={styles.pickerItemSeparator}
        listMessageContainerStyle={styles.pickerEmptyContainer}
        listMessageTextStyle={styles.pickerEmptyText}
        closeOnBackPressed
        zIndex={1000}
      />
    </View>
  );
};

export default SessionDropdown;

const styles = StyleSheet.create({
  wrap: {
    zIndex: 1000,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: color.white,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  pickerDropdown: {
    borderRadius: 12,
    borderColor: '#E5E7EB',
    backgroundColor: color.white,
  },
  pickerModal: {
    flexGrow: 1,
    backgroundColor: color.white,
    paddingBottom: 24,
  },
  pickerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  pickerSearchInput: {
    flexGrow: 1,
    flexShrink: 1,
    margin: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 0,
    backgroundColor: '#F3F4F6',
    color: '#1F1F1F',
    fontSize: 14,
  },
  pickerCloseIcon: {
    width: 20,
    height: 20,
    tintColor: '#9CA3AF',
  },
  pickerCloseIconContainer: {
    marginLeft: 12,
    padding: 4,
  },
  pickerListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  pickerListItemLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  pickerSelectedItem: {
    backgroundColor: '#F6F4FB',
  },
  pickerSelectedLabel: {
    color: color.primaryColor,
    fontWeight: '600',
  },
  pickerItemSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 16,
  },
  pickerEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  pickerText: {
    fontSize: 13,
    color: '#1F1F1F',
    fontWeight: '500',
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  pickerArrow: {
    tintColor: '#9CA3AF',
  },
  pickerTick: {
    tintColor: color.primaryColor,
  },
});
