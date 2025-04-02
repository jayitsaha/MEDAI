// src/services/NotificationService.js
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Initialize notifications
export const setupNotifications = async () => {
  try {
    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for notification!');
      return false;
    }
    
    // Set notification categories for both user types
    await setupNotificationCategories();
    
    return true;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return false;
  }
};

// Set up notification categories (for different types of notifications)
const setupNotificationCategories = async () => {
  // For Alzheimer's patients
  await Notifications.setNotificationCategoryAsync('MEDICATION_REMINDER', [
    {
      identifier: 'TAKE_NOW',
      buttonTitle: 'Take Now',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: 'REMIND_LATER',
      buttonTitle: 'Remind in 30 min',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
  ]);
  
  await Notifications.setNotificationCategoryAsync('SAFE_ZONE_ALERT', [
    {
      identifier: 'NAVIGATE_HOME',
      buttonTitle: 'Navigate Home',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: 'CALL_EMERGENCY',
      buttonTitle: 'Call Emergency Contact',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
  ]);
  
  // For pregnant patients
  await Notifications.setNotificationCategoryAsync('APPOINTMENT_REMINDER', [
    {
      identifier: 'VIEW_DETAILS',
      buttonTitle: 'View Details',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: 'RESCHEDULE',
      buttonTitle: 'Reschedule',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
  ]);
  
  await Notifications.setNotificationCategoryAsync('WATER_REMINDER', [
    {
      identifier: 'MARK_COMPLETED',
      buttonTitle: 'Add 250ml',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: 'REMIND_LATER',
      buttonTitle: 'Remind Later',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
  ]);
};

// Schedule a one-time notification
export const scheduleNotification = async (title, body, trigger, identifier = null) => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger,
      identifier,
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

// Schedule a daily notification
export const scheduleDailyNotification = async (
  title,
  body,
  hour,
  minute,
  identifier = null,
  categoryId = null
) => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        ...(categoryId && { categoryIdentifier: categoryId }),
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
      identifier,
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling daily notification:', error);
    return null;
  }
};

// Schedule a weekly notification
export const scheduleWeeklyNotification = async (
  title,
  body,
  weekday,
  hour,
  minute,
  identifier = null,
  categoryId = null
) => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        ...(categoryId && { categoryIdentifier: categoryId }),
      },
      trigger: {
        weekday,
        hour,
        minute,
        repeats: true,
      },
      identifier,
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling weekly notification:', error);
    return null;
  }
};

// Get all scheduled notifications
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Cancel a specific notification
export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.error('Error canceling notification:', error);
    return false;
  }
};

// Cancel all notifications
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    return false;
  }
};

// Send an immediate notification
export const sendNotification = async (title, body, data = {}, categoryId = null) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        ...(categoryId && { categoryIdentifier: categoryId }),
      },
      trigger: null, // null means send immediately
    });
    
    return true;
  } catch (error) {
    console.error('Error sending immediate notification:', error);
    return false;
  }
};

// Schedule regular app usage reminders (for Alzheimer's patients)
export const scheduleAppUsageReminders = async () => {
  try {
    // First, cancel any existing reminders
    await cancelAllNotificationsWithTag('app-reminder');
    
    // Get user type
    const userType = await AsyncStorage.getItem('userType');
    
    // Only schedule for Alzheimer's patients
    if (userType !== 'alzheimers') return false;
    
    // Schedule reminders every 5 minutes
    await scheduleNotification(
      'MEDAI Reminder',
      'Tap to check your medication and location.',
      { seconds: 300, repeats: true },
      'app-reminder-1'
    );
    
    return true;
  } catch (error) {
    console.error('Error scheduling app usage reminders:', error);
    return false;
  }
};

// Cancel all notifications with a specific tag
const cancelAllNotificationsWithTag = async (tag) => {
  try {
    const scheduled = await getScheduledNotifications();
    
    for (const notification of scheduled) {
      if (notification.identifier && notification.identifier.includes(tag)) {
        await cancelNotification(notification.identifier);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error canceling notifications with tag:', error);
    return false;
  }
};

// Set up notification response handler
export const setupNotificationResponseHandler = (navigation) => {
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const { notification } = response;
    const { data, categoryIdentifier } = notification.request.content;
    
    // Handle different types of notification responses
    switch (categoryIdentifier) {
      case 'MEDICATION_REMINDER':
        if (response.actionIdentifier === 'TAKE_NOW') {
          // Mark medication as taken
          // In a real app, you would update the medication status
          console.log('Medication marked as taken');
        } else if (response.actionIdentifier === 'REMIND_LATER') {
          // Schedule another reminder in 30 minutes
          scheduleNotification(
            notification.request.content.title,
            notification.request.content.body,
            { seconds: 1800 }, // 30 minutes
            `medication-reminder-reschedule-${Date.now()}`
          );
        } else {
          // Default tap action - navigate to medication screen
          navigation.navigate('Medication');
        }
        break;
        
      case 'SAFE_ZONE_ALERT':
        if (response.actionIdentifier === 'NAVIGATE_HOME') {
          // Open navigation to home
          navigation.navigate('SafeZone');
        } else if (response.actionIdentifier === 'CALL_EMERGENCY') {
          // In a real app, you would trigger an emergency call
          console.log('Emergency contact call initiated');
        } else {
          // Default tap action
          navigation.navigate('SafeZone');
        }
        break;
        
      case 'APPOINTMENT_REMINDER':
        // Navigate to appointment screen
        navigation.navigate('Appointments');
        break;
        
      case 'WATER_REMINDER':
        if (response.actionIdentifier === 'MARK_COMPLETED') {
          // In a real app, you would update water intake
          console.log('Water intake added');
        }
        // Navigate to diet screen
        navigation.navigate('Diet');
        break;
        
      default:
        // Handle general notification taps based on user type
        handleGeneralNotificationTap(data, navigation);
        break;
    }
  });
  
  return responseListener;
};

// Handle general notification taps
const handleGeneralNotificationTap = (data, navigation) => {
  // Check if the notification contains screen navigation data
  if (data && data.screen) {
    navigation.navigate(data.screen, data.params || {});
  } else {
    // Default to home screen
    navigation.navigate('Home');
  }
};

export default {
  setupNotifications,
  scheduleNotification,
  scheduleDailyNotification,
  scheduleWeeklyNotification,
  getScheduledNotifications,
  cancelNotification,
  cancelAllNotifications,
  sendNotification,
  scheduleAppUsageReminders,
  setupNotificationResponseHandler
};