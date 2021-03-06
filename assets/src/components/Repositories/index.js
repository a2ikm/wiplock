import React, { Component, PropTypes } from 'react';
import { ListGroup, Panel, InputGroup, FormControl, FormGroup,
  DropdownButton, MenuItem, Image } from 'react-bootstrap';
import { connect } from 'react-redux';
import Icon from 'react-fa';
import escapeStringRegexp from 'escape-string-regexp';
import { fetchRepositoriesIfNeeded } from '../../actions/repositories';
import createHistory from 'history/createBrowserHistory';
import ListItem from './components/ListItem';
import Spinner from '../Spinner';
import './index.styl';

class Reporitories extends Component {

  constructor(...args) {
    super(...args);
    this.history = createHistory();
    this.state = { filterText: '', selectedOrg: null };
  }

  componentDidMount() {
    const { dispatch } = this.props;
    const { history } = this;
    this.unlistenHistory = history.listen(this.historyDidChange.bind(this));
    dispatch(fetchRepositoriesIfNeeded());
    this.historyDidChange(history.location);
  }

  componentWillUnmount() {
    if (typeof this.unlistenHistory === 'function') {
      this.unlistenHistory();
      this.unlistenHistory = null;
    }
  }

  historyDidChange(location) {
    const filterText = ((location.search).match(/q=([^&]+)/) || [])[1];
    this.setState({ filterText });
  }

  renderFilterForm() {
    const { repos } = this.props;
    const { selectedOrg, filterText } = this.state;
    const orgNames = repos.map(repo => repo.owner.login);
    const orgs = repos
      .map(repo => repo.owner)
      .filter((val, index) => orgNames.indexOf(val.login) === index)
      ;
    return (
      <FormGroup bsSize='large'>
        <InputGroup>
          <InputGroup.Addon>
            <Icon name='search' />
          </InputGroup.Addon>
          <FormControl type='text' placeholder='Filter Repositories' defaultValue={filterText}
            onChange={e => this.history.push({ search: `?q=${e.target.value}` })} />
          <DropdownButton
            bsSize='large'
            pullRight
            componentClass={InputGroup.Button}
            id='input-dropdown-addon'
            title={selectedOrg ?
              <Image rounded src={selectedOrg.avatar_url} width={20} height={20} /> :
              <Icon name='user' />}>
            <MenuItem key='__all' onClick={() => this.setState({ selectedOrg: null })}>All</MenuItem>
            {orgs.map(org => (
              <MenuItem key={org.login} onClick={() => this.setState({ selectedOrg: org })}>
                <Image rounded src={org.avatar_url} width={16} height={16} />
                {' '}
                {org.login}
              </MenuItem>))}
          </DropdownButton>
        </InputGroup>
      </FormGroup>
    );
  }

  renderList(repos, filterText) {
    if (repos.length > 0) {
      return (
        <ListGroup>{repos.map(item =>
          <ListItem repoId={item.id} key={`repo-${item.id}`} filterText={filterText} />)}
        </ListGroup>
      );
    }
  }

  renderEmpty(repos) {
    if (repos.length === 0) {
      return <Panel bsStyle='warning'>No repositories matched with <code>{this.state.filterText}</code>.</Panel>;
    }
  }

  renderContent() { // eslint-disable-line complexity
    const { isFetching, repos } = this.props;
    const { selectedOrg } = this.state;
    if (isFetching) {
      return <Spinner />;
    }
    const filterText = this.state.filterText ?
      new RegExp(`(${escapeStringRegexp(this.state.filterText)})`, 'ig') : null;
    if (repos.length > 0) {
      const filteredRepos = repos.filter(({ name, owner: { login } }) => // eslint-disable-line complexity
        (!filterText || filterText.test(name) || filterText.test(login)) &&
        (!selectedOrg || selectedOrg.login === login));
      return (
        <div>
          {this.renderFilterForm()}
          {this.renderList(filteredRepos, filterText)}
          {this.renderEmpty(filteredRepos)}
        </div>
      );
    }
  }

  render() {
    return (
      <div id='repositories'>
        {this.renderContent()}
      </div>
    );
  }
}

Reporitories.displayName = 'Reporitories';

Reporitories.propTypes = {
  repos: PropTypes.arrayOf(PropTypes.object).isRequired,
  isFetching: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired
};

const mapStateToProps = (state) => { // eslint-disable-line complexity
  const {
    repositories: currentItems
  } = state;
  const {
    isFetching,
    items: repos
  } = currentItems || {
    isFetching: true,
    items: []
  };
  return { repos, isFetching };
};

export default connect(mapStateToProps)(Reporitories);
