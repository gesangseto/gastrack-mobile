import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import color from '../../constant/color';
import Header from '../../layouts/Header';

const AboutView = () => {
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="About" />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.logoBox}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.appName}>GasTrack</Text>
        <Text style={styles.appDesc}>
          Aplikasi Jasa Titip Belanja — kami yang urus.
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versi</Text>
            <Text style={styles.infoValue}>0.0.1</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>Android</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Developer</Text>
            <Text style={styles.infoValue}>GasTrack Team</Text>
          </View>
        </View>

        <View style={styles.flowCard}>
          <Text style={styles.flowTitle}>Alur Aplikasi Jastip</Text>
          <Text style={styles.flowDescription}>
            Alur kerja dari pendaftaran barang sampai transaksi selesai.
          </Text>
          {[
            ['1', 'Session', 'Buka periode Jastip aktif'],
            ['2', 'Item Registry', 'Daftarkan barang dan customer'],
            ['3', 'Batch', 'Kelompokkan barang untuk dikirim'],
            ['4', 'Inbound / GRN', 'Terima dan verifikasi barang'],
            ['5', 'Picking', 'Pilih barang dan siapkan pengiriman'],
            ['6', 'Courier', 'Kirim, tracking, dan simpan resi'],
            ['7', 'Finish / Sold', 'Konfirmasi barang diterima customer'],
          ].map(([number, title, description], index, flow) => (
            <View key={title} style={styles.flowItem}>
              <View style={styles.flowMarker}>
                <Text style={styles.flowNumber}>{number}</Text>
              </View>
              <View style={styles.flowContent}>
                <Text style={styles.flowStepTitle}>{title}</Text>
                <Text style={styles.flowStepDescription}>{description}</Text>
              </View>
              {index < flow.length - 1 && <View style={styles.flowLine} />}
            </View>
          ))}
        </View>

        <Text style={styles.copyright}>
          © 2026 GasTrack. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
};

export default AboutView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.white,
  },
  body: {
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 30,
    alignItems: 'center',
    paddingBottom: 35,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: color.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: color.primaryColor,
    marginTop: 16,
  },
  appDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#f7f7f7',
    borderRadius: 16,
    paddingHorizontal: 18,
    marginTop: 28,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
  },
  copyright: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 24,
  },
  flowCard: {
    width: '100%',
    backgroundColor: color.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: color.primaryColor,
  },
  flowDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    marginBottom: 14,
  },
  flowItem: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  flowMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  flowNumber: {
    color: color.white,
    fontSize: 12,
    fontWeight: '800',
  },
  flowContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 14,
  },
  flowStepTitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: '700',
  },
  flowStepDescription: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
  },
  flowLine: {
    position: 'absolute',
    left: 13,
    top: 28,
    bottom: 0,
    width: 2,
    backgroundColor: color.secondaryColor,
  },
});
