import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import color from '../../constant/color';
import Header from '../../layouts/Header';

const AboutView = ({navigation, route}) => {
  return (
    <View style={{flex: 1, backgroundColor: color.white}}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={color.primaryColor}
      />
      <Header title="About" />
      <View style={styles.body}>
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

        <Text style={styles.copyright}>
          © 2026 GasTrack. All rights reserved.
        </Text>
      </View>
    </View>
  );
};

export default AboutView;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: color.white,
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 30,
    alignItems: 'center',
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
});