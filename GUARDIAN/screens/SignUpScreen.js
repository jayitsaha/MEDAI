import React, {useState, useReducer, useEffect} from 'react';

import {
  View,
  Text,
  Button,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Platform,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Linking,
  Image
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ModalPopup from '../components/ModalPopup';
import {useTheme} from 'react-native-paper';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
//import {
//	WalletConnectModal,
//	useWalletConnectModal,
//} from '@walletconnect/modal-react-native';

// Add in the useWalletConnectModal hook
//import '../shim'

//Tools to connect to the backend
import axios from 'axios';
//import APP_CONFIG from '../app_configs';

const SignUpScreen = ({navigation}) => {
  const [selectedValue, setSelectedValue] = React.useState('Pedestrian');
  const [selectedValueTC, setSelectedValueTC] = React.useState('Disagree');

  const [visible, setVisible] = React.useState(false);
  const [visibleTC, setVisibleTC] = React.useState(false);
  const [visibleTCText, setVisibleTCText] = React.useState(false);

  const {colors} = useTheme();

  const [data, setData] = React.useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm_password: '',
    country: '',
    province: '',
    city: '',
    classCode: '',
    check_textInputChange: false,
    check_usernameInputChange: false,
    secureTextEntry: true,
    confirm_secureTextEntry: true,
    isValidEmailAddress: true,
    isValidUsername: true,
    isValidPassword: true,
    isValidPasswordConfirmation: true,
  });



  const createObj = () => {
    if (
      !data['username'] ||
      !data['email'] ||
      !data['password'] ||
      !data['isValidUsername'] ||
      !data['isValidEmailAddress'] ||
      !data['isValidPassword'] ||
      !data['isValidPasswordConfirmation']
    ) {
      return false;
    } else {
      //Make the class valid if it isnt already, if it doesnt exist, it makes it an empty string
      let classNumber = '';
      for (i = 0; i < data['classCode'].length; i++) {
        if (
          data['classCode'][i] != '1' &&
          data['classCode'][i] != '2' &&
          data['classCode'][i] != '3' &&
          data['classCode'][i] != '4' &&
          data['classCode'][i] != '5' &&
          data['classCode'][i] != '6' &&
          data['classCode'][i] != '7' &&
          data['classCode'][i] != '8' &&
          data['classCode'][i] != '9' &&
          data['classCode'][i] != '0'
        ) {
          Alert.alert('Class code can only contain numbers, please try again');
          return false;
        } else {
          console.log('being appended = ' + data['classCode'][i]);
          classNumber += data['classCode'][i];
        }
      }

      return {
        username: data['username'],
        firstName: data['firstName'],
        lastName: data['lastName'],
        email: data['email'],
        password: data['password'],
        country: data['country'],
        province: data['province'],
        city: data['city'],
        classCode: classNumber,
        accountType: selectedValue,
      };
    }
  };

  //Axios POST Function
  const postDataToServer = async () => {

  console.log("SIGNING UP")
//    if (selectedValue == 'Researcher') {
//      //cannot let the user register as a researcher at this time
//      Alert.alert(
//        'You cannot register as a researcher at this time. Please try again.',
//      );
//      return false;
//    }
//
//    let obj = createObj();
//    console.log('Obj being sent = ' + JSON.stringify(obj));
//
//    if (!obj) {
//      Alert.alert(
//        'Username, email, password, or confirmed password is incorrect',
//      );
//      return false;
//    }
//
//    let returnValue;
//
//    await axios({
//      method: 'post',
//      url: APP_CONFIG.WEB_HOST + '/api/loginData/newaccount',
//      data: obj,
//      headers: {'Content-Type': 'application/json'},
//    })
//      .then(function (response) {
//        //handle success
//        console.log(response);
//        console.log('success, status = ' + response['status']);
//        returnValue = true;
//        if (response['data'] == 'NoData') {
//          returnValue = false;
//          Alert.alert('That email/username is already in use');
//        } else {
//          global.username = data['username'];
//          global.jwtToken = response['data'];
//          returnValue = true;
//          if (response['data'] == 'NoData') {
//            returnValue = false;
//            Alert.alert('That email/username is already in use');
//          } else {
//            global.username = data['username'];
//            global.jwtToken = response['data'];
//            returnValue = true;
//          }
//        }
//      })
//      .catch(function (e) {
//        //handle error
//        console.log(e.response.status);
//        if (e.response.status === 409) {
//          Alert.alert('That email/username is already in use');
//        } else {
//          Alert.alert('Error connecting to server, please try again later');
//        }
//
//        returnValue = false;
//      });
//
//    return returnValue;
  };

  const changeRole = value => {
    if (value != selectedValue) {
      setVisible(false);
      setTimeout(() => {
        setSelectedValue(value);
      }, 400);
    }
  };
  const acceptTC = value => {
    if (value != selectedValueTC) {
      // setVisibleTC(false);
      setSelectedValueTC(value);
    }
  };

  const clearState = () => {
    setData({
      username: '',
      email: '',
      password: '',
      confirm_password: '',
      country: '',
      province: '',
      city: '',
      classCode: '',
      check_textInputChange: false,
      check_usernameInputChange: false,
      secureTextEntry: true,
      confirm_secureTextEntry: true,
    });
  };
  const textInputChangeUsername = val => {
    if (val.length >= 6) {
      setData({
        ...data,
        username: val,
        check_usernameInputChange: true,
        isValidUsername: true,
      });
    } else {
      setData({
        ...data,
        username: val,
        check_usernameInputChange: false,
        isValidUsername: false,
      });
    }
  };

  const textInputChangeFirstName = val => {
    setData({
      ...data,
      firstName: val,
    });
  };

  const textInputChangeLastName = val => {
    setData({
      ...data,
      lastName: val,
    });
  };

  const textInputChange = val => {
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    if (reg.test(val.trim()) === true) {
      setData({
        ...data,
        email: val.trim(),
        check_textInputChange: true,
        isValidEmailAddress: true,
      });
    } else {
      setData({
        ...data,
        email: val,
        check_textInputChange: false,
        isValidEmailAddress: false,
      });
    }
  };

  const handlePasswordChange = val => {
    if (val.trim().length >= 8) {
      setData({
        ...data,
        password: val,
        isValidPassword: true,
      });
    } else {
      setData({
        ...data,
        password: val,
        isValidPassword: false,
      });
    }
  };

  const handleConfirmPasswordChange = val => {
    if (val.trim().length >= 8) {
      if (val == data['password']) {
        setData({
          ...data,
          confirm_password: val,
          isValidPasswordConfirmation: true,
        });

        return;
      }
    }
    setData({
      ...data,
      confirm_password: val,
      isValidPasswordConfirmation: false,
    });
  };

  const updateSecureTextEntry = () => {
    setData({
      ...data,
      secureTextEntry: !data.secureTextEntry,
    });
  };

  const updateConfirmSecureTextEntry = () => {
    setData({
      ...data,
      confirm_secureTextEntry: !data.confirm_secureTextEntry,
    });
  };

  const handleCountryChange = val => {
    setData({
      ...data,
      country: val,
    });
  };

  const handleProvinceChange = val => {
    setData({
      ...data,
      province: val,
    });
  };

  const handleCityChange = val => {
    setData({
      ...data,
      city: val,
    });
  };
  const handleClassCodeChange = val => {
    setData({
      ...data,
      classCode: val,
    });
  };

  const handleValidUser = val => {
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    if (reg.test(val.trim()) === true) {
      setData({
        ...data,
        isValidEmailAddress: true,
      });
    } else {
      setData({
        ...data,
        isValidEmailAddress: false,
      });
    }
  };




  return (
    <ScrollView style={styles.container}>
      <StatusBar backgroundColor="#90A4AE" hidden barStyle="light-content" />
      <View style={styles.header}>
        <Text style={{color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: '6%',
    fontSize: 30,marginTop: 20}}>
          SIGN UP TO GUARDIAN
        </Text>
      </View>

      <ModalPopup visible={visible}>
        <View style={{alignItems: 'center'}}>
          <View style={styles.header_modal}>
            <Text style={(styles.text_footer, {fontWeight: 'bold'})}>
              SELECT YOUR ROLE
            </Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons
                name="close-outline"
                size={24}
                color="#52575D"></Ionicons>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.containerButton}>
          <View style={{marginTop: 19}}>
            <BouncyCheckbox
              isChecked={selectedValue == 'Pedestrian'}
              textColor="blue"
              borderColor="black"
              fillColor="#40c164"
              key={Math.random()}
              onPress={checked => changeRole('Pedestrian')}></BouncyCheckbox>
          </View>
          <Text style={styles.text_footer}>Pedestrian</Text>

        </View>

        <View style={styles.containerButton}>
                  <View style={{marginTop: 19}}>
                    <BouncyCheckbox
                      isChecked={selectedValue == 'Cleaner'}
                      textColor="blue"
                      borderColor="black"
                      fillColor="#40c164"
                      key={Math.random()}
                      onPress={checked => changeRole('Cleaner')}></BouncyCheckbox>
                  </View>
                  <Text style={styles.text_footer}>Cleaner</Text>

                </View>


                <View style={styles.containerButton}>
                  <View style={{marginTop: 19}}>
                    <BouncyCheckbox
                      isChecked={selectedValue == 'Policeman'}
                      textColor="blue"
                      borderColor="black"
                      fillColor="#40c164"
                      key={Math.random()}
                      onPress={checked => changeRole('Policeman')}></BouncyCheckbox>
                  </View>
                  <Text style={styles.text_footer}>Policeman</Text>

                </View>


                <View style={styles.containerButton}>
                  <View style={{marginTop: 19}}>
                    <BouncyCheckbox
                      isChecked={selectedValue == 'Fireman'}
                      textColor="blue"
                      borderColor="black"
                      fillColor="#40c164"
                      key={Math.random()}
                      onPress={checked => changeRole('Fireman')}></BouncyCheckbox>
                  </View>
                  <Text style={styles.text_footer}>Fireman</Text>

                </View>
      </ModalPopup>

      <ModalPopup visible={visibleTC}>
        <View style={{alignItems: 'center'}}>
          <View style={styles.header_modal}>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  'https://docs.google.com/document/d/1q5OXTVLHrXZBxed2H5Pjb6kqzYLe5OsOewK33EM-zCU/edit?usp=sharing',
                )
              }>
              <Text
                style={(styles.text_footer, {textDecorationLine: 'underline'})}>
                Please Accept the Following T&C
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setVisibleTC(false)}>
              <Ionicons
                name="close-outline"
                size={24}
                color="#52575D"></Ionicons>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.containerButton}>
          <View style={{marginTop: 19}}>
            <BouncyCheckbox
              isChecked={selectedValueTC == 'Agree'}
              textColor="blue"
              borderColor="black"
              fillColor="#40c164"
              key={Math.random()}
              //   text="Jayit"
              onPress={checked =>
                checked ? acceptTC('Agree') : acceptTC('Disagree')
              }></BouncyCheckbox>
          </View>
          <Text style={styles.text_footer}>I accept the given T&C</Text>
        </View>
        <TouchableOpacity
          key={Math.random()}
          style={styles.mainViewModalTC}
          disabled={!(selectedValueTC == 'Agree')}
          onPress={() => {
            postDataToServer().then(answer => {
              console.log("answer")
            });
          }}>
          <View style={styles.buttonModal}>
            <View

              style={[
                styles.signIn,
                {
                  borderColor: '#2F4858',
                  borderWidth: 1,
                  marginTop: 15,
                  backgroundColor: '#2F4858',
                },
              ]}>
              <Text
                style={[
                  styles.text_footerModal,
                  {
                    color: selectedValueTC == 'Agree' ? 'white' : '#696969',
                  },
                ]}>
                SIGN UP
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </ModalPopup>

      <ModalPopup visible={visibleTCText}>
        <View style={{alignItems: 'center'}}>
          <View style={styles.header_modal}>
            <Text style={(styles.text_footer, {fontWeight: 'bold'})}>
              The Terms and Conditions are as follows
            </Text>
            <TouchableOpacity onPress={() => setVisibleTCText(false)}>
              <Ionicons
                name="close-outline"
                size={24}
                color="#52575D"></Ionicons>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.containerButton}>
          <TouchableOpacity
            onPress={() => {
              //Linking.openURL('https://docs.google.com/document/d/1q5OXTVLHrXZBxed2H5Pjb6kqzYLe5OsOewK33EM-zCU/edit');
            }}>
            <Text
              style={(styles.text_footer, {textDecorationLine: 'underline'})}>
              I, Accept the given T&C
            </Text>
          </TouchableOpacity>
        </View>
      </ModalPopup>
      {(selectedValue === 'Pedestrian' || selectedValue === 'Cleaner') && (
        <Animatable.View animation="fadeInUpBig" style={styles.footer}>
          <ScrollView>
            <Text
              style={[
                styles.text_footer,
                {
                  marginTop: 35,
                },
              ]}>
              User Role
            </Text>
            <TouchableOpacity onPress={() => setVisible(true)}>
              <TextInput
                editable={false}
                style={styles.text_footer}
                autoCapitalize="none"
                defaultValue={selectedValue}
              />
            </TouchableOpacity>


            <Text style={styles.text_footer}>Name</Text>
            <View style={styles.action}>
              <FontAwesome name="user-o" color="#05375a" size={20} />
              <TextInput
                ////autocompleteType="name-given"
                placeholder="Name"
                placeholderTextColor="#05375a"
                style={styles.textInput}
                autoCapitalize="words"
                onChangeText={val => textInputChangeFirstName(val)}
              />
            </View>

                      
            <Text style={styles.text_footer}>Mobile Number</Text>
            <View style={styles.action}>
              <Ionicons name="call" color="#05375a" size={20} />
              <TextInput
                //autocompleteType="postal-address-region"
                placeholder="Mobile Number"
                placeholderTextColor="#05375a"
                style={styles.textInput}
                autoCapitalize="none"
                onChangeText={val => handleProvinceChange(val)}
              />
            </View>
            <Text style={styles.text_footer}>ID CARD</Text>
            <View style={styles.action}>
              <Ionicons
                name="card"
                color="#05375a"
                size={20}
              />
              <TextInput
                //autocompleteType="postal-address-locality"
                placeholder="ID CARD"
                placeholderTextColor="#05375a"
                style={styles.textInput}
                autoCapitalize="none"
                onChangeText={val => handleCityChange(val)}
              />
            </View>

            <Text style={styles.text_footer}>Sex</Text>
            <View style={styles.action}>
              <FontAwesome name="user-o" color="#05375a" size={20} />
              <TextInput
                placeholder="Sex"
                placeholderTextColor="#05375a"
                style={styles.textInput}
                autoCapitalize="none"
                onChangeText={val => handleClassCodeChange(val)}
              />
            </View>
            <View style={styles.textPrivate}>
              <Text style={styles.color_textPrivate}>
                By signing up you agree to our
              </Text>
              <Text style={[styles.color_textPrivate, {fontWeight: 'bold'}]}>
                {' '}
                Terms of service
              </Text>
              <Text style={styles.color_textPrivate}> and</Text>
              <Text style={[styles.color_textPrivate, {fontWeight: 'bold'}]}>
                {' '}
                Privacy policy
              </Text>
            </View>


            <View style={styles.button}>






                          <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={[
                                          styles.signIn,
                                          {
                                            borderColor: '#90A4AE',
                                            borderWidth: 1,
                                            marginTop: 15,
                                            backgroundColor: '#90A4AE',
                                          },
                                        ]}>
                            <Text
                              style={[
                                                styles.textSign,
                                                {
                                                  color: '#fff',
                                                },
                                              ]}>
                              Sign Up
                            </Text>
                          </TouchableOpacity>
                        </View>

            <View style={styles.button}>






              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[
                  styles.signIn,
                  {
                    borderColor: '#90A4AE',
                    borderWidth: 1,
                    marginTop: -20,
                  },
                ]}>
                <Text
                  style={[
                    styles.textSign,
                    {
                      color: '#90A4AE',
                    },
                  ]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animatable.View>
      )}




    </ScrollView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#90A4AE',
    marginTop: 0
  },
  header: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  footer: {
    flex: Platform.OS === 'ios' ? 3 : 5,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  text_header: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: '6%',
    fontSize: 30,
  },
  text_footer: {
    color: '#05375a',
    fontSize: 18,
    marginTop: 20,
  },
  action: {
    flexDirection: 'row',
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    paddingBottom: 5,
  },
  textInput: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : -12,
    paddingLeft: 10,
    color: '#05375a',
  },
  pickerInput: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : -12,
    marginBottom: 10,
    paddingLeft: 10,
    color: '#05375a',
  },
  button: {
    alignItems: 'center',
    marginTop: 50,
  },
  signIn: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  textSign: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  textPrivate: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  color_textPrivate: {
    color: 'grey',
  },
  modalBackGround: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 20,
    elevation: 20,
  },
  header_modal: {
    width: '100%',
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginBottom: 10,
  },
  containerButton: {
    // flex: 1,
    flexDirection: 'row',
    margin: 0,
    marginBottom: 10,
    // justifyContent: 'space-between',
  },
  buttonModal: {
    width: '90%',
    height: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
    marginBottom: 35,
    marginTop: 40,
  },
  buttonMod: {
    width: '90%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 35,
    marginTop: 35,
  },
  mainViewModalTC: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  text_footerModal: {
    color: '#05375a',
    fontSize: 18,
  },
  errorMsg: {
    color: '#FF0000',
    fontSize: 14,
  },
  buttonGPlusStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dc4e41',
        borderWidth: 0.5,
        borderColor: '#fff',
        height: 40,
        borderRadius: 5,
        margin: 5,
      },
      buttonFacebookStyle: {
      width: '100%',
          height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 0.5,
        height: 40,
        borderRadius: 5,
        margin: 5,
        borderColor: '#2F4858',
        borderWidth: 1,
        marginTop: 15,
        borderRadius: 10,
        padding: 10


      },
      buttonImageIconStyle: {
        padding: 10,
        margin: 5,
        height: 25,
        width: 25,
        resizeMode: 'stretch',

      },
      buttonTextStyle: {
        color: '#2F4858',
        marginBottom: 4,
        marginLeft: 10,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 50
      },
      buttonIconSeparatorStyle: {
        backgroundColor: '#fff',
        width: 1,
        height: 40,
        },
        buttonFacebookStyle: {
            width: '100%',
                height: 60,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff',
              borderWidth: 0.5,
              height: 40,
              borderRadius: 5,
              margin: 5,
              borderColor: '#2F4858',
              borderWidth: 1,
              marginTop: 15,
              borderRadius: 10,
              padding: 10


            },
            buttonImageIconStyle: {
              padding: 10,
              margin: 5,
              height: 25,
              width: 25,
              resizeMode: 'stretch',

            },
            buttonTextStyle: {
              color: '#2F4858',
              marginBottom: 4,
              fontSize: 18,
              fontWeight: 'bold',
              marginLeft: 70
            },
            buttonIconSeparatorStyle: {
              backgroundColor: '#fff',
              width: 1,
              height: 40,
              }
});