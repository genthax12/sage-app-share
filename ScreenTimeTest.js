// SAGE — Screen Time detection test harness.
// PURPOSE: prove (and MEASURE) that iOS reliably tells us when the user crosses
// their daily limit. This is the #1 technical risk for the whole product.
//
// TO RUN THIS SCREEN (temporarily):
//   In index.js, change:   import App from './App';
//            to:           import App from './ScreenTimeTest';
//   Rebuild is NOT needed for JS changes — just reload the dev app.
//   Revert that line when you're done testing.
//
// HOW TO TEST:
//   1. Tap "1 · Request permission" and allow Screen Time.
//   2. Tap "2 · Choose apps" and pick something you'll open (e.g. Safari/Instagram).
//   3. Set the limit low (1 minute) and tap "3 · Start monitoring".
//   4. Use that app for ~1 minute. Watch the log: when "eventDidReachThreshold"
//      appears and the app gets shielded, note how close to 1 minute it fired.
//      That delay is the number that decides everything.

import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, Modal, Platform } from 'react-native';
import * as RNDA from 'react-native-device-activity';

const GOLD = '#C7A24E';
const CHAR = '#1E201B';
const CREAM = '#F5F2EA';
const PANEL = '#2b2c22';
const LINE = 'rgba(199,162,78,0.25)';

const SELECTION_ID = 'sage-apps';
const ACTIVITY = 'sage-daily';

export default function ScreenTimeTest() {
  const [auth, setAuth] = useState('unknown');
  const [selection, setSelection] = useState(null);
  const [limit, setLimit] = useState('1');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [log, setLog] = useState([]);
  const listener = useRef(null);

  const add = (msg) => {
    const t = new Date();
    const stamp = t.toLocaleTimeString() + '.' + String(t.getMilliseconds()).padStart(3, '0');
    setLog((prev) => [`${stamp}  ${msg}`, ...prev].slice(0, 200));
  };

  useEffect(() => {
    if (Platform.OS !== 'ios') { add('Not iOS — Screen Time only works on a real iPhone.'); return; }
    // Live event stream from the DeviceActivity monitor (only fires while app is alive).
    try {
      listener.current = RNDA.onDeviceActivityMonitorEvent((event) => {
        const name = event?.nativeEvent?.callbackName || 'event';
        add(`⚡ ${name}`);
        if (name === 'eventDidReachThreshold') add('   → LIMIT CROSSED — shield should apply now.');
      });
    } catch (e) { add('listener error: ' + e.message); }
    return () => { try { listener.current && listener.current.remove(); } catch (e) {} };
  }, []);

  const readStatus = () => {
    try {
      let s = 'unknown';
      if (typeof RNDA.getAuthorizationStatus === 'function') s = RNDA.getAuthorizationStatus();
      setAuth(String(s));
      return String(s);
    } catch (e) { return 'unknown'; }
  };

  const requestPermission = async () => {
    try {
      await RNDA.requestAuthorization();
    } catch (e) { add('auth error: ' + e.message); }
    // requestAuthorization often returns nothing; read the real status, polling past the known delay
    let tries = 0;
    let s = readStatus();
    const iv = setInterval(() => {
      s = readStatus(); tries += 1;
      if (s === 'approved' || s === 'authorized' || tries >= 6) { clearInterval(iv); add('Authorization status: ' + s); }
    }, 600);
  };

  const onSelectionChange = (event) => {
    const sel = event?.nativeEvent?.familyActivitySelection ?? null;
    setSelection(sel);
    if (sel) {
      try { RNDA.setFamilyActivitySelectionId({ id: SELECTION_ID, familyActivitySelection: sel }); } catch (e) {}
      add('Apps selected ✓');
    }
  };

  const configureShield = () => {
    try {
      RNDA.updateShield(
        {
          title: "Time's up.",
          subtitle: 'You hit your SAGE limit. Take a breath before you scroll on.',
          primaryButtonLabel: 'I\'ll pause',
          backgroundColor: { red: 18, green: 19, blue: 13 },
          titleColor: { red: 245, green: 242, blue: 234 },
          subtitleColor: { red: 180, green: 178, blue: 164 },
          primaryButtonBackgroundColor: { red: 199, green: 162, blue: 78 },
          primaryButtonLabelColor: { red: 22, green: 22, blue: 16 },
        },
        { primary: { type: 'dismiss', behavior: 'close' } }
      );
    } catch (e) { add('shield config error: ' + e.message); }
  };

  const startMonitoring = async () => {
    if (!selection) { add('Pick apps first (step 2).'); return; }
    const mins = Math.max(1, parseInt(limit, 10) || 1);
    const schedule = {
      intervalStart: { hour: 0, minute: 0, second: 0 },
      intervalEnd: { hour: 23, minute: 59, second: 59 },
      repeats: true,
    };
    const events = [
      {
        eventName: `limit_reached_${mins}m`,
        familyActivitySelection: selection,
        threshold: { minute: mins },
        // DETECT-ONLY for now (no blocking) to isolate the crash:
      },
    ];
    add('Calling startMonitoring…');
    try {
      await RNDA.startMonitoring(ACTIVITY, schedule, events);
      add(`Monitoring started · limit ${mins} min · ${new Date().toLocaleTimeString()}`);
      add('Now use the selected app for the full limit; it should get shielded.');
    } catch (e) { add('startMonitoring error: ' + (e && e.message ? e.message : e)); }
  };

  const showNativeEvents = () => {
    try {
      const evs = RNDA.getEvents();
      add('Native event history: ' + JSON.stringify(evs));
    } catch (e) { add('getEvents error: ' + e.message); }
  };

  const clearShield = () => {
    try { RNDA.blockSelection({ activitySelectionId: SELECTION_ID }); } catch (e) {}
    // Unblock via a fresh monitor stop; simplest reset:
    try { RNDA.stopMonitoring(ACTIVITY).catch(() => {}); } catch (e) {}
    add('Reset: monitoring stopped (reopen a blocked app after a moment).');
  };

  const Btn = ({ label, onPress, subtle }) => (
    <TouchableOpacity onPress={onPress} style={{
      backgroundColor: subtle ? 'transparent' : GOLD, borderWidth: subtle ? 1 : 0, borderColor: LINE,
      paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, marginBottom: 10,
    }}>
      <Text style={{ color: subtle ? CREAM : CHAR, fontWeight: '700', textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#141410' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ color: GOLD, fontWeight: '700', fontSize: 22, letterSpacing: 4, marginBottom: 4 }}>SAGE</Text>
        <Text style={{ color: CREAM, fontSize: 16, marginBottom: 4 }}>Detection test harness</Text>
        <Text style={{ color: '#9c978a', fontSize: 12, marginBottom: 18 }}>Auth status: {auth}</Text>

        <Btn label="1 · Request permission" onPress={requestPermission} />
        <Btn label="2 · Choose apps to limit" onPress={() => setPickerVisible(true)} subtle />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ color: CREAM, marginRight: 12 }}>Limit (minutes):</Text>
          <TextInput
            value={limit} onChangeText={setLimit} keyboardType="number-pad"
            style={{ backgroundColor: PANEL, color: CREAM, borderWidth: 1, borderColor: LINE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, width: 70, textAlign: 'center' }}
          />
        </View>
        <Btn label="3 · Start monitoring" onPress={startMonitoring} />
        <Btn label="Show native event history" onPress={showNativeEvents} subtle />
        <Btn label="Reset / stop" onPress={clearShield} subtle />

        <Text style={{ color: GOLD, fontWeight: '700', marginTop: 18, marginBottom: 8 }}>Log (newest first)</Text>
        <View style={{ backgroundColor: '#0f100c', borderWidth: 1, borderColor: LINE, borderRadius: 12, padding: 12, minHeight: 200 }}>
          {log.length === 0 ? <Text style={{ color: '#6f6b60' }}>No events yet…</Text> :
            log.map((l, i) => <Text key={i} style={{ color: '#cfcabb', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 3 }}>{l}</Text>)}
        </View>
      </ScrollView>

      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickerVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#141410' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
            <Text style={{ color: CREAM, fontWeight: '700', fontSize: 16 }}>Choose apps to limit</Text>
            <TouchableOpacity onPress={() => setPickerVisible(false)}><Text style={{ color: GOLD, fontWeight: '700' }}>Done</Text></TouchableOpacity>
          </View>
          <RNDA.DeviceActivitySelectionView
            style={{ flex: 1, width: '100%' }}
            familyActivitySelection={selection}
            onSelectionChange={onSelectionChange}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
