// Please see documentation at https://docs.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.


const arweave = Arweave.init({});

async function createWallet() {
    await arweave.wallets.generate().then((key) => {
        $('.newWalletKey').text(JSON.stringify(key));
    });
    
}

async function uploadFile() {
    $('#errorDescription').css('display', 'none');
    var file = document.getElementById('selectedFile');
    var key = $('#walletKey').val();
    var description = $('#description').val();
    var expirationYears = $('#expirationYears').val();
    var derivationSelect = $('#derivationSelect').val();
    var derivationRevenueShare = $('#derivationRevenueShare').val();

    if (key == '') {
        $('#errorDescription').css('display', 'block');
        $('#errorDescription').text("Your Arweave key (wallet) is required.");
        return;
    }

    try {
        var keyParsed = JSON.parse(key);
    }
    catch {
        $('#errorDescription').css('display', 'block');
        $('#errorDescription').text("The Arweave key (wallet) is invalid.");
        return;
    }

    if (file.files.length == 0) {
        $('#errorDescription').css('display', 'block');
        $('#errorDescription').text("The file is required.");
        return;
    }

    if (expirationYears == '') {
        $('#errorDescription').css('display', 'block');
        $('#errorDescription').text("The expiration (in years) for this file is required.");
        return;
    }

    if (description == '') {
        $('#errorDescription').css('display', 'block');
        $('#errorDescription').text("The file description is required.");
        return;
    }

    let transaction = await arweave.createTransaction({ data: (await file.files[0].arrayBuffer()) });
    transaction.addTag('Content-Type', file.files[0].type);
    transaction.addTag('Description', description);
    transaction.addTag('Expires', expirationYears);
    if (derivationSelect == 'Allowed-With-RevenueShare-') {
        if (derivationRevenueShare == '') {
            $('#errorDescription').css('display', 'block');
            $('#errorDescription').text("The revenue share percentage is required for this derivation.");
            return;
        }
        transaction.addTag("Derivation", 'Allowed-With-RevenueShare-' + derivationRevenueShare+'%');
    }
    else {
        transaction.addTag("Derivation", derivationSelect);
    }
    
    $('#errorDescription').css('display', 'none');
    $('#successDescription').css('display', 'block');
    $('#successDescription').text('Uploading and licencing paper.');
    await arweave.transactions.sign(transaction, JSON.parse(key));

    let uploader = await arweave.transactions.getUploader(transaction);

    while (!uploader.isComplete) {
        await uploader.uploadChunk();
        console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    }
    $('#successDescription').text('Paper uploaded on Arweave, with id ' + transaction.id);
    
}

async function calculateCost() {
    try {
        var key = $('#walletKey').val();
        var file = document.getElementById('selectedFile');
        var size = file.files[0].size;
        var description = $('#description').val();
        var expirationYears = $('#expirationYears').val();
        var derivationSelect = $('#derivationSelect').val();
        var derivationRevenueShare = $('#derivationRevenueShare').val();
        let transaction = await arweave.createTransaction({ data: (await file.files[0].arrayBuffer()) });
        transaction.addTag('Content-Type', file.files[0].type);
        transaction.addTag('Description', description);
        transaction.addTag('Expires', expirationYears);
        if (derivationSelect == 'Allowed-With-RevenueShare-') {
            transaction.addTag("Derivation", 'Allowed-With-RevenueShare-' + derivationRevenueShare + '%');
        }
        else {
            transaction.addTag("Derivation", derivationSelect);
        }
        await arweave.transactions.sign(transaction, JSON.parse(key));

        var costinWinston = await arweave.transactions.getPrice(transaction.data_size);
        var costinAR = arweave.ar.winstonToAr(costinWinston);
        $('#arweaveCost').text(costinAR + ' AR');
    }
    catch {
        $('#arweaveCost').text('');
    }
    
}

$(function () {
    $('#generateWalletBtn').click(async function () {
       await createWallet();
    });
    $('#btnUploadFile').click(async function () {
        await uploadFile();
    });

    $('#derivationSelect').change(async function () {
        if ($(this).val() == 'Allowed-With-RevenueShare-') {
            $('#derivationRevenue').css('display', 'block');
        }
        else {
            $('#derivationRevenue').css('display', 'none');
        }
        await calculateCost();
    });
});

