const localData = {}

if (typeof google !== 'undefined') {
  google.charts.load('current', {
    packages: ['corechart']
  })
}

$(document).ready(function () {

  faucetBalanceUpdate();

  $('#searchButton').click(function () {
    searchForTerm($('#searchValue').val())
  })

  $('#receiveButton').click(function () {
    receive($('#receiverAddress').val())
  })

  $(".navbar-burger").click(function () {
    $(".navbar-burger").toggleClass("is-active");
    $(".navbar-menu").toggleClass("is-active");
  });
})

function faucetBalanceUpdate() {
  $.ajax({
    url: "https://faucet-api.herokuapp.com/api/balance",
    dataType: 'json',
    type: 'GET',
    cache: 'false',
    success: function(header) {
      totalBal = header.availableBalance + header.lockedAmount
      totalBal = numeral(Math.floor(totalBal)).format('0,0') + ' XSC'
      $('#faucetBalance').text(totalBal)
      faucetBalanceUpdate()
    },
    error: function() {
      console.log("Failed to get XSC balance in faucet wallet")
      faucetBalanceUpdate()
    }
  })

}

function receive(address) {
  $.ajax({
    url: "https://faucet-api.herokuapp.com/api/sendTo?address=" + address,
    dataType: 'json',
    type: 'GET',
    cache: 'false',
    success: function(header) {
      console.log(header)
    },
    error: function() {
      console.log("There is an error")
    }
  })
}

function isHash(str) {
  const regex = new RegExp('^[0-9a-fA-F]{64}$')
  return regex.test(str)
}

function getCurrentNetworkHashRateLoop() {
  $.ajax({
    url: ExplorerConfig.apiBaseUrl + '/api/latest',
    dataType: 'json',
    type: 'GET',
    cache: 'false',
    success: function (header) {
      localData.networkHashRate = Math.floor(header.difficulty / ExplorerConfig.blockTargetTime)
      $('#globalHashRate').text(numeral(localData.networkHashRate).format('0,0') + ' H/s')
      setTimeout(function () {
        getCurrentNetworkHashRateLoop()
      }, 15000)
    },
    error: function () {
      setTimeout(function () {
        getCurrentNetworkHashRateLoop()
      }, 15000)
    }
  })
}

function searchForTerm(term) {
  term = term.trim()
  /* Allow commas in a height search */
  term = term.replace(',', '')
  if (parseInt(term).toString() === term) {
    /* This should be height so we know to perform a search on height */
    $.ajax({
      url: ExplorerConfig.apiBaseUrl + '/api/block?height=' + term + '?random=' + (new Date()).getTime(),
      dataType: 'json',
      type: 'GET',
      cache: 'false',
      success: function (data) {
        window.location = './block.html?hash=' + data.hash
      },
      error: function () {
        setSearchValueErrorState(true)
      }

    })

  } else if (isHash(term)) {
    /* Great, we're pretty sure that this is a hash, let's see if we can find out what type */

    /* Let's see if it's a block hash first? */
    $.ajax({
      url: ExplorerConfig.apiBaseUrl + '/api/blockByHash?hash=' + term,
      dataType: 'json',
      type: 'GET',
      cache: 'false',
      success: function (data) {
        /* We found a block that matched, let's go take a look at it */
        console.log("it is a block hash!")
        window.location = './block.html?hash=' + data.hash
      },
      error: function () {
        console.log("It is not a block hash!,checking to see if its a transaction hash")
        console.log("The query term is " + term)
        /* It's not a block, is it a transaction? */
        $.ajax({
          url: ExplorerConfig.apiBaseUrl + '/api/blockByTxHash?' + 'TxHash=' + term,
          dataType: 'json',
          type: 'GET',
          cache: 'false',
          success: function (data) {
            console.log("It a transaction hash")
            /* Great, we found a matching transaction, let's go take a look at it */
            window.location = './transaction.html?hash=' + data.txDetails.hash
          },
          error: function () {
            /* It's not a transaction hash, must be a paymentId */
            console.log(url)
            $.ajax({
              url: ExplorerConfig.apiBaseUrl + '/transactions/' + term,
              dataType: 'json',
              type: 'GET',
              cache: 'false',
              success: function (data) {
                if (data.length !== 0) {
                  /* It's a payment Id, let's display the list */
                  window.location = './paymentid.html?id=' + term
                } else {
                  setSearchValueErrorState(true)
                }
              },
              error: function () {
                /* We don't know what this is... */
                setSearchValueErrorState(true)
              }
            })
          }
        })
      }
    })
  } else {
    setSearchValueErrorState(true)
  }
}

function setSearchValueErrorState(state) {
  if (state) {
    $('#searchValue').removeClass('is-danger').addClass('is-danger')
  } else {
    $('#searchValue').removeClass('is-danger')
  }
}

function getQueryStringParam(key) {
  const queryString = window.location.search.substring(1)
  const params = queryString.split('&')
  for (var i = 0; i < params.length; i++) {
    var param = params[i].split('=')
    if (param[0] === key) {
      return param[1]
    }
  }
}

function secondsToHumanReadable(seconds) {
  var days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  var hrs = Math.floor(seconds / 3600);
  seconds -= hrs * 3600;
  var mnts = Math.floor(seconds / 60);
  seconds -= mnts * 60;

  return {
    days: days,
    hours: hrs,
    minutes: mnts,
    seconds: seconds
  }
}
