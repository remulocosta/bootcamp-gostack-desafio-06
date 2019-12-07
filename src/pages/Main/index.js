import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Keyboard, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

import api from '../../services/api';

import {
  Container,
  Form,
  Input,
  SubmitButton,
  List,
  User,
  Avatar,
  Name,
  Bio,
  ProfileButton,
  ProfileButtonText,
  Aviso,
  DelButton,
  Buttons,
} from './styles';

export default class Main extends Component {
  static propTypes = {
    navigation: PropTypes.shape({
      navigate: PropTypes.func,
    }).isRequired,
  };

  state = {
    newUser: '',
    users: [],
    loading: false,
    error: null,
    msg: '',
  };

  async componentDidMount() {
    const users = await AsyncStorage.getItem('users');

    if (users) {
      this.setState({ users: JSON.parse(users) });
    }
  }

  async componentDidUpdate(_, prevState) {
    const { users } = this.state;
    if (prevState.users !== users) {
      AsyncStorage.setItem('users', JSON.stringify(users));
    }
  }

  handleAddUser = async () => {
    const { users, newUser } = this.state;

    this.setState({ loading: true, error: false });

    try {
      if (newUser === '') throw new Error('Você precisa indicar um usuário');

      const hasUser = users.find(u => u.login === newUser);

      if (hasUser) throw new Error('Usuário já cadastrado');

      const response = await api.get(`/users/${newUser}`);

      const data = {
        name: response.data.name,
        login: response.data.login,
        bio: response.data.bio,
        avatar: response.data.avatar_url,
      };

      this.setState({
        users: [...users, data],
        newUser: '',
        loading: false,
      });

      Keyboard.dismiss();
    } catch (error) {
      this.setState({ error: true, msg: error.message });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleRemoveUser = async user => {
    const { users } = this.state;

    // const index = users.findIndex(u => u.login === user.login);
    // users.splice(index, 1);
    users.splice(
      users.findIndex(u => u.login === user.login),
      1
    );

    this.setState({ users });

    AsyncStorage.setItem('users', JSON.stringify(users));
  };

  handleNavigate = user => {
    const { navigation } = this.props;

    navigation.navigate('User', { user });
  };

  static navigationOptions = {
    title: 'Usuários',
  };

  render() {
    const { users, newUser, loading, error, msg } = this.state;

    return (
      <Container>
        <Aviso>{msg}</Aviso>
        <Form>
          <Input
            error={error}
            autoCorrect={false}
            autoCapitalize="none"
            placeholder="Adicionar usuário"
            value={newUser}
            onChangeText={text =>
              this.setState({ newUser: text, error: null, msg: '' })
            }
            returnKeyType="send"
            onSubmitEditing={this.handleAddUser}
          />

          <SubmitButton loading={loading} onPress={this.handleAddUser}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Icon name="add" size={20} color="#FFF" />
            )}
          </SubmitButton>
        </Form>

        <List
          data={users}
          keyExtractor={user => user.login}
          renderItem={({ item }) => (
            <User>
              <Avatar source={{ uri: item.avatar }} />
              <Name>{item.name}</Name>
              <Bio>{item.bio}</Bio>

              <Buttons>
                <ProfileButton onPress={() => this.handleNavigate(item)}>
                  <ProfileButtonText>Ver perfil</ProfileButtonText>
                </ProfileButton>
                <DelButton onPress={() => this.handleRemoveUser(item)}>
                  <Icon name="remove" size={20} color="#FFF" />
                </DelButton>
              </Buttons>
            </User>
          )}
        />
      </Container>
    );
  }
}
