let addToCartButtons = document.querySelectorAll('[data-action=ADD_TO_CART]');
let cartDom = document.querySelector('.cart');

//let cart = [];
// már a localstorage-ból jön a cart, a string-et vissza kell parse-olni tömbbé
// üres tömb, ha nincs adat, különben null-t kapunk
let cart = JSON.parse(localStorage.getItem('cart')) || []; 

// a storage-ban megmaradnak az itemek újratöltés után, viszont a DOM megjelenítést is le kell kezelni
// minden elemre, ami a storage tömbben van jöjjön létre a div

// ha vannak itemek a tömbben, hozzáadjuk a dom-hoz ugyanúgy, mintha az Add to cart gombot használnánk
// ekkor a click események nem működnek  a gombokon, mert az if-en kívül vannak eredetileg

if( cart.length > 0 )
{
    cart.forEach( (product) => {
        insertProductToDOM(product);
        countCartTotal();

            // localstorage esetén is kezelni kell, ha már benne van a tömbben az item, legyen disabled a gomb
            // nem kell külön eventListenert létrehozni 
            addToCartButtons.forEach( button => {
                let currentProduct = button.parentNode;

                // ha a szülő elem neve megegyezik a localstorage-ban tárolt product nevével, akkor disabled
                if(currentProduct.querySelector('.product__name').innerText === product.name)
                {
                    handleActionButtons(button, product);
                }
            }) 
        })
}

// ES6
addToCartButtons.forEach(button => {
    button.addEventListener('click', () => {
        let currentProduct = button.parentNode;
        
        // mikor nem storage-ból adunk hozzá, alapértelmezetten 1 a mennyiség, így 
        // a btn-danger feltételt elég vizsgálni csak a localstorage-ból való hozzáadás esetén
        const product = {
            image: currentProduct.querySelector('.product__image').getAttribute('src'),
            name: currentProduct.querySelector('.product__name').innerText,
            price: currentProduct.querySelector('.product__price').innerText,
            quantity: 1
        };

        // ellenőrizni kell, hozzá lett-e már adva a product korábban
        const isInCart = cart.filter(cartItem => (cartItem.name === product.name)).length > 0;
        console.log(isInCart);
        // csak akkor tesszük bele, ha még nincs a kosárban (tagadjuk a fenti értéket)
        if(!isInCart)
        {
            insertProductToDOM(product);     

            cart.push(product);
            saveCart();

            //  localStorage.setItem('cart', JSON.stringify(cart));
            //  countCartTotal();

            handleActionButtons(button, product);
        }
    });
});

//** console.log(document.querySelector('.cart-footer')); //null, amíg nincs termék a kosárban

// mivel product-ra hivatkozunk a függvényen belül, át kell adni paraméterként
function insertProductToDOM(product)
{
    cartDom.insertAdjacentHTML('beforeend',
            `<div class="cart__item">
                <img class="cart__item__image" src="${product.image}" alt="${product.name}">
                <h2 class="cart__item__name"> ${product.name} </h2>
                <h3 class="cart__item__price"> ${product.price} </h3>
                <h3 class="cart__item__quantity"> ${product.quantity} </h3>
                <button class="btn btn--primary btn--small ${(product.quantity === 1 ? 'btn--danger' : '' )}" 
                    data-action="DECREASE_QUANTITY"> &minus; </button>
                <button class="btn btn--primary btn--small" data-action="INCREASE_QUANTITY"> &plus; </button>
                <button class="btn btn--danger btn--small" data-action="DELETE_PRODUCT"> &times; </button>
                
            </div>`
            );
    
    addCartFooter();
}

function handleActionButtons(button, product)
{
    button.innerText = 'Already in cart';
    button.disabled = true;

    let cartItems = cartDom.querySelectorAll('.cart__item');
    
    cartItems.forEach(cartItem => {
        if( cartItem.querySelector('.cart__item__name').innerText === product.name )
        {
            cartItem.querySelector('[data-action="INCREASE_QUANTITY"]')
            .addEventListener('click', () => increaseAction(product, cartItem));

            cartItem.querySelector('[data-action="DECREASE_QUANTITY"]')
            .addEventListener('click', () => decreaseAction(product, cartItem, button));

            cartItem.querySelector('[data-action="DELETE_PRODUCT"]')
            .addEventListener('click', () => deleteAction(product, cartItem, button));
        }
    });
}

function increaseAction(product, cartItem)
{
    console.log('cartItem:', cartItem);
    cart.forEach(item => {
        if(item.name === product.name)
        {
            cartItem.querySelector('.cart__item__quantity').innerText = ++item.quantity;
            // item.quantity++ esetén első kattintásra nem növeszik az érték mert ekkor
            // először megjelenik az érték, aztán növeli az értékét.
            // ++item.quantity esetén először növeli meg az értéket, aztán jelenik meg
            cartItem.querySelector('[data-action="DECREASE_QUANTITY"]').classList.remove('btn--danger');
            // minden egyes változást is menteni kell a storage-ba: ki lett szervezve function-be utólag
            saveCart();
        }
    })
}

function decreaseAction(product, cartItem, button)
{
    cart.forEach(item => {
        if(item.name === product.name)
        {
            if( item.quantity > 1 )
            {
                cartItem.querySelector('.cart__item__quantity').innerText = --item.quantity;
                saveCart();
            }
            else
            {
                deleteAction(product, cartItem, button);
            }

            if( item.quantity == 1 )
            {
                cartItem.querySelector('[data-action="DECREASE_QUANTITY"]').classList.add('btn--danger');
            }
        }
    })
}

function deleteAction(product, cartItem, button) 
{
    cartItem.classList.add('cart__item__removed');
    setTimeout(() => cartItem.remove(), 250);

    // magában a cart tömmben viszont még mindig megmarad a termék
    console.log(cart);
    cart = cart.filter(cartItem => cartItem.name !== product.name);
    saveCart();

    console.log(cart);

    // gomb visszaállítása disabled állapotról
    button.innerText = 'Add to cart';
    button.disabled = false;

    // ha üres a kosár, a footer-ben lévő gombok is tűnjenek el
    if (cart.length < 1) 
    {
        document.querySelector('.cart-footer').remove();
    }
}

function addCartFooter()
{
    // beszúrás a div.cart html elem után
    /* minden egyes új product hozzáadásakor újból létrejön a 2 gomb is, vizsgálni kell, 
    létezik-e már a footer. Csak akkor szúrjuk be a 2 gombot, ha a .cart-footer null, még nem létezik(**) 
     */
    if( document.querySelector('.cart-footer') === null )
    {
        cartDom.insertAdjacentHTML('afterend', 
        `<div class="cart-footer">
        <button class="btn btn--danger" data-action="CLEAR_CART"> Clear Cart </button>
        <button class="btn btn--primary" data-action="CHECKOUT"> Pay </button> 
        </div>`
        );
    
    /* event listenerek. Csak akkor fusson le a clearCart is, ha nincs footer, különben
     null errort kapunk** */
    document.querySelector('[data-action="CLEAR_CART').addEventListener('click', () => clearCart());
    document.querySelector('[data-action="CHECKOUT').addEventListener('click', () => checkOut());
    }

    //**  document.querySelector('[data-action="CLEAR_CART').addEventListener('click', () => clearCart());
    //  document.querySelector('[data-action="CHECKOUT').addEventListener('click', () => checkOut());
}

function clearCart()
{
    document.querySelectorAll('.cart__item').forEach(cartItem => {
        cartItem.classList.add('.cart__item__removed');
        setTimeout( () => cartItem.remove(), 250);
    })

    cart = [];
    localStorage.removeItem('cart');

    if (cart.length < 1) 
    {
        document.querySelector('.cart-footer').remove();
    }


    addToCartButtons.forEach( button => {
        button.innerText = 'Add to cart';
        button.disabled = false;
    })
}

// https://developer.paypal.com/docs/paypal-payments-standard/integration-guide/formbasics/
function checkOut()
{
    let paypalFormHTML = `
    <form id="paypal-form" action="https://www.paypal.com/cgi-bin/webscr" method="post">
      <input type="hidden" name="cmd" value="_cart">
      <input type="hidden" name="upload" value="1">
  `;

  cart.forEach((cartItem, index) => {
      // 0. index -> item_name_1, 1. index -> item_name_2, stb.
    ++index;
    paypalFormHTML += `
      <input type="hidden" name="item_name_${index}" value="${cartItem.name}">
      <input type="hidden" name="amount_${index}" value="${cartItem.price}">
      <input type="hidden" name="quantity_${index}" value="${cartItem.quantity}">
    `;
  });

  paypalFormHTML += `
      <input type="submit" value="PayPal">
    </form>
    <div class="overlay"></div>
  `;

 
  document.querySelector('body').insertAdjacentHTML('beforeend', paypalFormHTML);

  document.getElementById('paypal-form').submit();
}


function countCartTotal()
{
    let cartTotal = 0;

    cart.forEach( cartItem => {
        cartTotal += (cartItem.quantity * cartItem.price);
    })

    document.querySelector('[data-action="CHECKOUT"]').innerText = 'Pay ₱' + cartTotal;

    console.log(cartTotal);
}

function saveCart()
{
    
    localStorage.setItem('cart', JSON.stringify(cart));
    countCartTotal();
}

