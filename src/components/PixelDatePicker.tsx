import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { colors, pixelFont, shadowSmall } from '../theme';

const arrowUp = require('../../assets/ui/arrow_up.png');
const arrowDown = require('../../assets/ui/arrow_down.png');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

interface Props {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
}

export default function PixelDatePicker({ value, onChange, minDate }: Props) {
  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay] = useState(value.getDate());

  function update(y: number, m: number, d: number) {
    const maxDay = daysInMonth(y, m);
    const finalDay = Math.min(d, maxDay);
    setYear(y);
    setMonth(m);
    setDay(finalDay);
    onChange(new Date(y, m, finalDay));
  }

  function changeMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0) { newMonth = 11; newYear--; }
    update(newYear, newMonth, day);
  }

  function changeDay(delta: number) {
    const maxDay = daysInMonth(year, month);
    let newDay = day + delta;
    if (newDay > maxDay) newDay = 1;
    if (newDay < 1) newDay = maxDay;
    update(year, month, newDay);
  }

  function changeYear(delta: number) {
    update(year + delta, month, day);
  }

  const now = new Date();
  const daysLeft = Math.ceil((new Date(year, month, day).getTime() - now.getTime()) / (86400000));

  return (
    <View style={s.container}>
      <View style={s.row}>
        {/* Day */}
        <View style={s.col}>
          <TouchableOpacity onPress={() => changeDay(1)} style={s.arrow}>
            <Image source={arrowUp} style={s.arrowImg} />
          </TouchableOpacity>
          <Text style={s.value}>{day.toString().padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => changeDay(-1)} style={s.arrow}>
            <Image source={arrowDown} style={s.arrowImg} />
          </TouchableOpacity>
          <Text style={s.label}>DAY</Text>
        </View>

        <Text style={s.sep}>/</Text>

        {/* Month */}
        <View style={s.col}>
          <TouchableOpacity onPress={() => changeMonth(1)} style={s.arrow}>
            <Image source={arrowUp} style={s.arrowImg} />
          </TouchableOpacity>
          <Text style={s.value}>{MONTHS[month]}</Text>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={s.arrow}>
            <Image source={arrowDown} style={s.arrowImg} />
          </TouchableOpacity>
          <Text style={s.label}>MON</Text>
        </View>

        <Text style={s.sep}>/</Text>

        {/* Year */}
        <View style={s.col}>
          <TouchableOpacity onPress={() => changeYear(1)} style={s.arrow}>
            <Image source={arrowUp} style={s.arrowImg} />
          </TouchableOpacity>
          <Text style={s.value}>{year}</Text>
          <TouchableOpacity onPress={() => changeYear(-1)} style={s.arrow}>
            <Image source={arrowDown} style={s.arrowImg} />
          </TouchableOpacity>
          <Text style={s.label}>YEAR</Text>
        </View>
      </View>

      <Text style={[s.countdown, daysLeft <= 0 && s.countdownWarn]}>
        {daysLeft <= 0 ? 'Pick a future date' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days from now`}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  col: { alignItems: 'center' },
  arrow: { padding: 4, outlineStyle: 'none' } as any,
  arrowImg: { width: 20, height: 20 },
  value: {
    fontFamily: pixelFont,
    color: colors.purple,
    fontSize: 14,
    width: 55,
    textAlign: 'center',
  },
  sep: { fontFamily: pixelFont, color: colors.textDim, fontSize: 14, marginHorizontal: 2 },
  label: { fontFamily: pixelFont, color: colors.textMuted, fontSize: 6, marginTop: 2 },
  countdown: { fontFamily: pixelFont, color: colors.textDim, fontSize: 7, marginTop: 8 },
  countdownWarn: { color: colors.coral },
});
