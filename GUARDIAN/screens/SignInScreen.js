import React, {useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
  Pressable,
  Image
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PatientDashboardScreen from "./PatientDashboardScreen";

import {useTheme} from 'react-native-paper';

import AsyncStorage from '@react-native-async-storage/async-storage';

import axios from 'axios';

const SignInScreen = ({route, navigation}) => {

  const [data, setData] = React.useState({
    username: '',
    password: '',
    check_textInputChange: false,
    secureTextEntry: true,
    isValidPassword: true,
  });
  const {colors} = useTheme();
  const [checked, setChecked] = React.useState(true);

  const storeData = async (key, input) => {
    try {
      await AsyncStorage.setItem('@' + key, input);
    } catch (e) {
      console.log('error ', e);
    }
  };

  const getData = async () => {
    try {
      const username = await AsyncStorage.getItem('@username');
      const password = await AsyncStorage.getItem('@password');

      if (username !== null && password != null) {
        setChecked(true);

        setData({
          ...data,
          username: username,
          password: password,
        });

        //This commented out section allows auto login
        /*let obj = createObj(username, password);

        console.log("OBJ = " + JSON.stringify(obj));

        sendLoginDetailsToSever(obj).then((value) => {
          if (value) {  //If it successfully communicated with the server
            //First save login details to memory
            navigation.navigate('Home');

          } else {
            console.log("failed to auto-login");
          }
        });*/
      }
    } catch (e) {
      console.log('error ', e);
    }
  };

  useEffect(() => {
    //Try to auto login
    getData();
  }, []);




  //The checkbox mechanism
  const CheckBox = ({
    selected,
    onPress,
    style,
    textStyle,
    size = 30,
    color = '#211f30',
    text = '',
    ...props
  }) => (
    <TouchableOpacity
      style={[styles.checkBox, style]}
      onPress={() => setChecked(!checked)}>
      <Icon
        size={size}
        color={color}
        name={selected ? 'check-box' : 'check-box-outline-blank'}
      />

      <Text style={textStyle}> {text} </Text>
    </TouchableOpacity>
  );

  const textInputChange = val => {
    setData({
      ...data,
      username: val,
      check_textInputChange: true,
    });
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

  const updateSecureTextEntry = () => {
    setData({
      ...data,
      secureTextEntry: !data.secureTextEntry,
    });
  };

  const handleValidUser = val => {
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    if (reg.test(val) === true) {
      setData({
        ...data,
        isValidUser: true,
      });
    } else {
      setData({
        ...data,
        isValidUser: false,
      });
    }
  };

  //Ensure the user has entered both a username and password to continue
  const checkData = () => {
    if (data['username'] != '' && data['password'] != '') {
      return true;
    }
    return false;
  };

  const createObj = (optionalusername, optionalPassword) => {
    if (optionalusername && optionalPassword) {
      return {
        username: optionalusername,
        password: optionalPassword,
      };
    } else {
      if (!data['isValidPassword']) {
        return false;
      } else {
        return {
          username: data['username'],
          password: data['password'],
        };
      }
    }
  };

  //Axios POST Function
  const sendLoginDetailsToSever = async optionalObj => {

  console.log("HI THERE LOGGIN IN")
//    let obj = optionalObj;
//    if (!optionalObj) obj = createObj();
//    if (!obj) return false;
//
//    console.log('Object being set to backend ' + JSON.stringify(obj));
//
//    let returnValue;
//    await axios({
//      method: 'post',
//      url: APP_CONFIG.WEB_HOST + '/api/loginData/login',
//      data: obj,
//      headers: {'Content-Type': 'application/json'},
//    })
//      .then(function (response) {
//        //handle success
//        console.log('success, status = ' + response['status']);
//
//        if (response['data'] == 'NoData') {
//          console.log('NO DATA being returned');
//          returnValue = false;
//        } else {
//          console.log('new reponse is ' + JSON.stringify(response['data']));
//          global.username = response['data']['username'];
//          global.jwtToken = response['data']['jwt'];
//          global.accountType = response['data']['accountType'];
//          returnValue = true;
//        }
//      })
//      .catch(function (response) {
//        //handle error
//        console.log('Error');
//        console.log(JSON.stringify(response));
//        returnValue = false;
//      });
//    return returnValue;
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#59439C" barStyle="light-content" hidden />
      <View style={styles.header}>
        {/* <Text style={styles.text_header}>WELCOME TO GUARDIAN</Text> */}
        <Image
              style={{
                width: 250,
                height: 250,
                resizeMode: 'contain',
                justifyContent: "center",
                alignSelf:"center",
              }}
              source={require("../assets/introduction_animation/app_logo.png")}
            />
      </View>



        

      <Animatable.View
        animation="fadeInUpBig"
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
          },
        ]}>

        <Text
          style={[
            styles.text_footer,
            {
              color: colors.text,
            },
          ]}>
          Username
        </Text>
        <View style={styles.action}>
          <FontAwesome name="user-o" color={colors.text} size={20} />
          <TextInput
            autoCompleteType="username"
            placeholder={'Your username'}
            value={data['username']}
            placeholderTextColor="#666666"
            style={[
              styles.textInput,
              {
                color: "black",
              },
            ]}
            autoCapitalize="none"
            onChangeText={val => textInputChange(val)}
            //onEndEditing={e => handleValidUser(e.nativeEvent.text)}
          />
          {data.check_textInputChange ? (
            <Animatable.View animation="bounceIn">
              <Feather name="check-circle" color="green" size={20} />
            </Animatable.View>
          ) : null}
        </View>
        {/*data.isValidUser ? null : (
          <Animatable.View animation="fadeInLeft" duration={500}>
            <Text style={styles.errorMsg}>Username is of wrong format.</Text>
          </Animatable.View>
        )*/}

        <Text
          style={[
            styles.text_footer,
            {
              color: colors.text,
              marginTop: 5,
            },
          ]}>
          Password
        </Text>
        <View style={styles.action}>
          <Feather name="lock" color={colors.text} size={20} />
          <TextInput
            autoCompleteType="password"
            placeholder="Your Password"
            value={data['password']}
            placeholderTextColor="#666666"
            secureTextEntry={data.secureTextEntry ? true : false}
            style={[
              styles.textInput,
              {
                color: "black",
              },
            ]}
            autoCapitalize="none"
            onChangeText={val => handlePasswordChange(val)}
          />
          <TouchableOpacity onPress={updateSecureTextEntry}>
            {data.secureTextEntry ? (
              <Feather name="eye-off" color="grey" size={20} />
            ) : (
              <Feather name="eye" color="grey" size={20} />
            )}
          </TouchableOpacity>
        </View>
        {data.isValidPassword ? null : (
          <Animatable.View animation="fadeInLeft" duration={500}>
            <Text style={styles.errorMsg}>
              Password must be 8 characters long.
            </Text>
          </Animatable.View>
        )}

        {/*Needs to be built*/}
        <TouchableOpacity>
          <Text style={{color: '#2F4858', marginTop: 15}}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        <View style={{marginTop: 20}}>
          <CheckBox
            selected={checked}
            onPress={setChecked}
            text="Remember me"
          />
        </View>

        <View style={styles.button}>
          <TouchableOpacity
            style={[
              styles.signIn,
              {
                borderColor: '#90A4AE',
                borderWidth: 1,
                marginTop: 15,
                backgroundColor: '#90A4AE',
              },
            ]}
            onPress={async () => {
              //if (!loginInfo) saveData("loginDetails", data);
              if (1==1) {
                sendLoginDetailsToSever().then(value => {
                  console.log('Value = ' + value);
                  if (1==1) {
                    //If it successfully communicated with the server

                    if (checked) {
                      //Save login details to memory
                      storeData('username', data['username']);
                      storeData('password', data['password']);
                    } else {
                      //Delete it from memory if it exists
                      storeData('username', '');
                      storeData('password', '');
                    }


                    if(data['username'] == "jayit"){
                      navigation.navigate('PoliceManDashboard', {
                        username: 'username',
                        jwt: 'token',
                      });
                    }

                    if(data['username'] == "ravi"){
                      navigation.navigate('MainApp', {
                        username: 'username',
                        jwt: 'token',
                      });
                    }

                    if(data['username'] == "cleaner"){
                      navigation.navigate('CleanerDashboard', {
                        username: 'username',
                        jwt: 'token',
                      });
                    }

                    if(data['username'] == "fireman"){
                      navigation.navigate('FiremanDashboard', {
                        username: 'username',
                        jwt: 'token',
                      });
                    }

                    
                  } else {
                    Alert.alert(
                      'Invalid username or password, please try again',
                    );
                  }
                });
              } else {
                Alert.alert(
                  'Please enter both the username, and password to log in',
                );
              }
            }}>
            <View>
              <Text
                style={[
                  styles.textSign,
                  {
                    color: '#fff',
                  },
                ]}>
                Sign In
              </Text>
            </View>
          </TouchableOpacity>


          <TouchableOpacity
            onPress={() => {
              navigation.navigate('SignUpScreen');
            }}
            style={[
              styles.signIn,
              {
                borderColor: '#90A4AE',
                borderWidth: 1,
                marginTop: 15,
              },
            ]}>
            <Text
              style={[
                styles.textSign,
                {
                  color: '#90A4AE',
                },
              ]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    </View>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#90A4AE',
  },
  header: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 90
  },
  footer: {
    flex: 3,
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
    fontSize: 30,
  },
  text_footer: {
    color: '#05375a',
    fontSize: 18,
  },
  action: {
    flexDirection: 'row',
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    paddingBottom: 5,
  },
  actionError: {
    flexDirection: 'row',
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FF0000',
    paddingBottom: 5,
  },
  textInput: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : -12,
    paddingLeft: 10,
    color: '#05375a',
  },
  errorMsg: {
    color: '#FF0000',
    fontSize: 14,
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
  checkBox: {
    flexDirection: 'row',
    alignItems: 'center',
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
      }
});