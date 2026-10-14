import React from 'react';
import { DeviceSummary } from '../types';
import { DeviceDataScreen } from './DeviceDataScreen';

interface MediaGridScreenProps {
  device: DeviceSummary;
  onBack: () => void;
}

export const MediaGridScreen: React.FC<MediaGridScreenProps> = ({ device, onBack }) => {
  return <DeviceDataScreen device={device} onBack={onBack} />;
};
