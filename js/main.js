var recentBlocks, topBlockHeight, blockchainChart, blockchainChartData, blockchainChartOptions

$(document).ready(function() {
  getAndDisplayLastBlockHeader()
})

function getAndDisplayLastBlockHeader() {
  $.ajax({
    // apiBaseUrl: 'https://blockapi.turtlepay.io' original
    // apiBaseUrl: 'http://178.128.108.105:5000/obsidian/'
    url: ExplorerConfig.apiBaseUrl + '/api/latest',
    dataType: 'json',
    type: 'GET',
    cache: 'false',
    success: function (data) {
      if (data.height !== topBlockHeight) {
        topBlockHeight = data.height
        updateRecentBlocks(recentBlocks, topBlockHeight)
      }
      $('#blockchainHeight').text(numeral(data.height).format('0,0'))
      $('#blockchainDifficulty').text(numeral(data.difficulty).format('0,0'))
      $('#blockchainHashRate').text(numeral(data.difficulty / ExplorerConfig.blockTargetTime).format('0,0') + ' H/s')
      $('#blockchainReward').text(numeral(data.reward / Math.pow(10, ExplorerConfig.decimalPoints)).format('0,0.00') + ' ' + ExplorerConfig.ticker)
      $('#blockchainTransactions').text(numeral(data.alreadyGeneratedTransactions).format('0,0'))
      $('#blockchainCirculatingSupply').text(numeral(data.alreadyGeneratedCoins / Math.pow(10, ExplorerConfig.decimalPoints)).format('0,0.00') + ' ' + ExplorerConfig.ticker)
      $('#blockchainTotalSupply').text(numeral(ExplorerConfig.maxSupply / Math.pow(10, ExplorerConfig.decimalPoints)).format('0,0.00') + ' ' + ExplorerConfig.ticker)

      var nextFork
      // original code is if there is more than one fork
      //chanege the code below
      // for (var i = ExplorerConfig.forkHeights.length; i > 0; i--) {
      //   if (data.height >= ExplorerConfig.forkHeights[i]) {
      //     nextFork = ExplorerConfig.forkHeights[i + 1]
      //
      //     break
      //   }
      // }
      //there is only one forkTime
      nextFork = ExplorerConfig.forkHeights[0]
      //dont change this
      var forkInSeconds = (nextFork - data.height) * ExplorerConfig.blockTargetTime
      var forkTime = secondsToHumanReadable(forkInSeconds)
      var estimatedFork = (Math.floor(Date.now() / 1000) + forkInSeconds)
      $('#nextForkIn').text(forkTime.days + 'd ' + forkTime.hours + 'h ' + forkTime.minutes + 'm ' + forkTime.seconds + 's').prop('title', (new Date(estimatedFork * 1000)).toGMTString())

      const maxSupply = ExplorerConfig.maxSupply
      const curSupply = data.alreadyGeneratedCoins
      const emiss = (curSupply / maxSupply) * 100

      $('#blockchainSupplyEmission').text(numeral(emiss).format('0.000000') + ' %')
    }
  })
}

function updateTransactionPool(table) {
  $.ajax({
    url: ExplorerConfig.apiBaseUrl + '/api/latestTransactions',
    dataType: 'json',
    type: 'GET',
    cache: 'false',
    success: function (data) {
      $("#transactionPoolCount").text(data.length)
      table.clear()
      for (var i = 0; i < data.length; i++) {
        var txn = data[i]
        table.row.add([
          numeral(txn.amount_out / Math.pow(10, ExplorerConfig.decimalPoints)).format('0,0.00'),
          numeral(txn.fee / Math.pow(10, ExplorerConfig.decimalPoints)).format('0,0.00'),
          numeral(txn.size).format('0,0'),
          txn["hash"]
        ])

      }
      table.draw(false)
    }
  })
}

function updateRecentBlocks(table, height) {
  $.ajax({
    url: ExplorerConfig.apiBaseUrl + '/api/getBlocks',
    dataType: 'json',
    type: 'GET',
    cache: 'false',
    success: function (data) {
      table.clear()
      var chartData = [
        ['Block Time', 'Difficulty', 'Block Size', 'Txn Count']
      ]

      for (var i = 0; i < data.length; i++) {
        var block = data[i]
        chartData.push(
          [(new Date(block.timestamp * 1000 + ((new Date()).getTimezoneOffset() * 60 * 1000))), parseInt(block.difficulty), parseInt(block.size), parseInt(block.tx_count)]
        )
        table.row.add([
          numeral(block.height).format('0,0'),
          numeral(block.size).format('0,0'),
          block.hash,
          numeral(block.difficulty).format('0,0'),
          numeral(block.tx_count).format('0,0'),
          (new Date(block.timestamp * 1000)).toGMTString()
        ])
      }

      blockchainChartData = google.visualization.arrayToDataTable(chartData)
      table.draw(false)
      drawBlockchainChart()
    }
  })
}

function drawBlockchainChart() {
  try {
    blockchainChart = new google.visualization.AreaChart(document.getElementById('blockchainChart'))
    blockchainChart.draw(blockchainChartData, blockchainChartOptions)
  } catch (e) {}
}
