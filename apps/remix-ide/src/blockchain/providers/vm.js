const Web3 = require('web3')
const { BN, privateToAddress, stripHexPrefix, hashPersonalMessage } = require('ethereumjs-util')
const RemixSimulator = require('@remix-project/remix-simulator')

class VMProvider {

  constructor (executionContext) {
    this.executionContext = executionContext
    this.RemixSimulatorProvider = new RemixSimulator.Provider({executionContext: this.executionContext})
    this.RemixSimulatorProvider.init()
    this.web3 = new Web3(this.RemixSimulatorProvider)
    this.accounts = {}
  }

  getAccounts (cb) {
    this.web3.eth.getAccounts((err, accounts) => {
      if (err) {
        return cb('No accounts?')
      }
      return cb(null, accounts)
    })
  }

  resetEnvironment () {
    this.RemixSimulatorProvider.Accounts.resetAccounts()
    this.accounts = {}
  }

  sendMethod (address, abi, methodName, params, outputCb) {
    return new Promise((resolve, reject) => {
      // TODO: should use selected account
      this.getAccounts((error, accounts) => {
        console.dir("accounts")
        console.dir(accounts)
        console.dir(params)
        const contract = new this.web3.eth.Contract(abi, address, { from: accounts[0] })
        contract.methods[methodName].apply(contract.methods[methodName], params).send().then(resolve).catch(reject)
      })
    })
  }

  callMethod (address, abi, methodName, params, outputCb) {
    return new Promise((resolve, reject) => {
      // TODO: should use selected account
      this.getAccounts((error, accounts) => {
        console.dir("accounts")
        console.dir(accounts)
        const contract = new this.web3.eth.Contract(abi, address, { from: accounts[0] })
        contract.methods[methodName].apply(contract.methods[methodName], params).call().then(resolve).catch(reject)
      })
    })
  }

  // TODO: is still here because of the plugin API
  // can be removed later when we update the API
  createVMAccount (newAccount) {
    const { privateKey, balance } = newAccount
    this.RemixSimulatorProvider.Accounts._addAccount(privateKey, balance)
    const privKey = Buffer.from(privateKey, 'hex')
    return '0x' + privateToAddress(privKey).toString('hex')
  }

  newAccount (_passwordPromptCb, cb) {
    this.RemixSimulatorProvider.Accounts.newAccount(cb)
  }

  getBalanceInEther (address, cb) {
    address = stripHexPrefix(address)
    this.web3.eth.getBalance(address, (err, res) => {
      if (err) {
        return cb(err)
      }
      cb(null, Web3.utils.fromWei(new BN(res).toString(10), 'ether'))
    })
  }

  getGasPrice (cb) {
    this.web3.eth.getGasPrice(cb)
  }

  signMessage (message, account, _passphrase, cb) {
    const messageHash = hashPersonalMessage(Buffer.from(message))
    this.web3.eth.sign(message, account, (error, signedData) => {
      if (error) {
        return cb(error)
      }
      cb(null, '0x' + messageHash.toString('hex'), signedData)
    })
  }

  getProvider () {
    return 'vm'
  }
}

module.exports = VMProvider
