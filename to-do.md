

# ID-Biding 

## web-view

1. Lottery (1d)
   (a) lottery algorithm-done
   [if admin make changes to winning lot setting with already points issues to user]
   (b) fetching past purchase of the user-ranjeeet // search id_pos_data collection
   (c) issue point LMS api integration-Pending
   (d) save data to cosmos db collection-Done
   ff) update manual lottery count+product lottery count in binded_users collection-DONE
   (f) manual award eligibility function-DONE
   (g) flow-integration-Done

[
    We gave 100 points quickly. You can check it in the history.
    q1: *** upon successful binding, issue 100 points. user can keep bind and unbind, still can accumulate points without even buying any items ***
    Buy Pampers now and
    get up to 400 points!
    100 scoop points when you purchase for the first time!
    *Soon after the first purchase, the bonus points will be awarded in about one month.
    *Applicable to all Pampers except wipes.
    A chance to win up to 300 points by drawing lots!
    * It takes about 2 weeks from the purchase of the product until you can draw lots.
    q2: *** past purchase should be currentDate-2 weeks  ***
]
2. Id-Binding LMS integration (1/2d)-PENDING

3. Lohaco id-biding (1/2d)
    (a) yahoo api integration- DONE
    (b) azure id-binding func call-PENDING
    (c) save data to cosmos db collection(BINDED_USERS) - DONE

4. Amazon & Rokuten id-binding (1d)
    (a) Money-forward api integration-PENDING
    (b) azure id-binding func call-PENDING
    (c) save data to cosmos db collection(BINDED_USERS)

5. Contenful integration across pages (1d)-PENDING
    (a) lottery
    (b) lottery-draw
    (c) lottery-draw-result
    (d) retailer
    (e) detail(lohaco, amazon and rakuten)
    (g) bind-complete
    (f) unbind-complete
    (h) error

Total: 4 days

## Pamper-portal

1. accessToken expiry setting(currently its 1d)
2. refreshtoken integration
    (a) check accessToken expiration. if it does, 
        - request for new acces token with refresh token api
        - redirect user to login page
        which flow we should go ahead??


TO DO: sat: 10am

1. Lottery: points issue and updating availability-DONE
2. Lottery point issue to LMS/ALP- Pending
3. Lottery: validation if any campaign runnning(date range)
4. Lohaco: azure id-binding func call
5. LMS integration - LMS env is not ready
6. MF-
7. handling locale in web-view. with queryString??
8. "Pampers.users" and "portal.binded_users" collection will be in sync always? No

Q1: if the monthly break down is achive, shall we allow user to play the lottery wheel?
Q2: can there more than one active campaign running simultaneously??

Wed, 22-july 2020

alert: Whole admin panel would be in Japanese language.

MF flow:-

initial env_variables inputs required:
1. client_id
2. client_secret
3. admin_access_token
4. admin_refresh_token

**** admin_refresh_token would be needed when admin_access_token gets expired, and need to get new admin_access_token) ***

flow:
1. check if admin_access_token is valid or not before making any MF api call
 function isAdminAccessTokenValid(adminAccessToken, uid){
     // 1. check if we have any user already binded to amazon/rakuten.
        a) find it in collection binded_users
        b) if it exists in collection, make api(4. Account Acquisition Status API) call with uid, else return true
        c) if api call returns response status as 409 conflict, return true  else return false(response 200 OK)

 }


Thursday, 23-july 2020

1. lottery campaign: validation
    - lottery campaign date range cannot overlapw while creating new campaign-Done
    - lottery breakup validation-Done
        - date range(start date should be less or equal to end date)
        - sum of total points should not cross total campaign max points
2. web-view
    - lottery: store transaction for each lottery draw-Done
    - MF: store user token and refresh token on sucessful binding-Pending

Friday, 24-July 2020
1. web:
    - export data to csv(retailer and products)
    - import history
        -maintaining in collection(
            originalFileName,
            newFileName, 
            createdAt, 
            recordCount,
            status(success/fail)
        )
        - showing it in portal as well (past 30 days)
2. web-view
    - MF: store user token and refresh token on sucessful binding
    - running it wih en-US locale as querystring(by default ja-JP)

Sat, 25-July 2020

1. web: download product as csv-Done