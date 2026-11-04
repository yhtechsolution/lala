<img src="/mnt/data/SOUR_media/media/image1.png"
style="width:2.9875in;height:0.675in" /><img src="/mnt/data/SOUR_media/media/image2.png"
style="width:1.25833in;height:0.70752in" />

*Lala guesthouse collection*

**Software User Requirements**

**Version 2.1**

# Table of Contents

**1. Introduction** 3

> 1.1 Purpose 3
>
> 1.2 Project Overview 3
>
> 1.3 Project Aim 4
>
> 1.4 Objectives from a User Perspective 4
>
> 1.5 Intended Audience 4
>
> 1.6 Definitions 4

**2. Background and User Problem** 5

> 2.1 Background 5
>
> 2.2 Problem Statement 5
>
> 2.3 User Problems and Proposed Solutions 5
>
> 2.4 Expected Benefits to Users 6

**3. Stakeholders and User Groups** 7

> 3.1 Stakeholders 7
>
> 3.2 User Group A: Administrators 7
>
> 3.3 User Group B: Customers 8
>
> 3.4 User Group C: Registered Customers 8

**4. User Needs and Expectations** 9

> 4.1 General Expectations 9
>
> 4.2 Guesthouse Information Needs 9
>
> 4.3 Search and Discovery Expectations 10
>
> 4.4 Account and Personalisation Expectations 10
>
> 4.5 Administrator Expectations 10

**5. User Requirements** 11

> 5.1 Administrator Requirements 11
>
> 5.2 Customer Requirements 11
>
> 5.3 Registered Customer Requirements 12

**6. User Stories and Use Scenarios** 12

> 6.1 Scenario A: An Administrator Registers a Guesthouse 12
>
> 6.2 Scenario B: A Customer Discovers a Guesthouse 15
>
> 6.3 Scenario C: A Customer Saves a Favourite 18
>
> 6.4 Scenario D: A Customer Submits a Rating 18
>
> 6.5 Scenario E: An Administrator Reviews Dashboard Statistics 18

**7. User Interaction and Navigation Requirements** 19

> 7.1 Admin Portal Navigation 19
>
> 7.2 Customer Application Navigation 19
>
> 7.3 Form Interaction 21
>
> 7.4 Search and Filter Interaction 22
>
> 7.5 Error and Empty States 22

**8. Usability and Accessibility Requirements** 22

> 8.1 Ease of Use 22
>
> 8.2 Visual Presentation 23
>
> 8.3 Accessibility Considerations 23

**9. User Acceptance Criteria** 23

> 9.1 User Evaluation 24

**10. Scope Boundaries and User Limitations** 24

> 10.1 Included User Capabilities 24
>
> 10.2 Excluded User Capabilities 25
>
> 10.3 Known Limitations 25

**11. Requirements Prioritisation** 26

> 11.1 Recommended Implementation Order 26

**Appendices** 27

> Appendix A. Requirements Traceability Summary 27
>
> Appendix B. User Evaluation Record Template 27
>
> Appendix C. Figure List 28

# 1. Introduction

## 1.1 Purpose

The purpose of this Software User Requirements (SOUR) document is to
describe the needs, expectations, goals and tasks of the people who will
interact with the Lala Guesthouse Platform.

The document identifies the problems the platform is intended to address
and explains how the proposed web-based Admin Portal and mobile Customer
Application should support their respective users.

It serves as a user-centred reference for the project team when
designing interfaces, planning features, developing application
workflows and evaluating whether the completed system meets users’
needs.

The document complements the Software Requirements Specification (SRS).
While the SRS defines detailed and testable system requirements, this
document concentrates on the intended users, their goals, their expected
interactions with the platform and the outcomes they should be able to
achieve.

## 1.2 Project Overview

Lala is a two-part guesthouse discovery platform designed to make
guesthouse information easier to manage, find and compare.

The platform consists of:

1.  **Web Admin Portal:** Used by authorised administrators to register
    guesthouses, maintain listings and view dashboard statistics.

2.  **Mobile Customer Application:** Used by customers to browse
    guesthouses, search by name or location, filter by price or rating,
    save favourites and submit ratings.

Customers must be able to browse available guesthouse information
without registering. Registration and login are required for
account-specific features such as favourites and ratings.

The platform focuses on discovery and listing management. It does not
provide booking, reservation or payment services.

## 1.3 Project Aim

To provide an accessible and user-friendly guesthouse discovery platform
that enables administrators to manage guesthouse information efficiently
and enables customers to discover and compare accommodation options
conveniently.

## 1.4 Objectives from a User Perspective

The platform should enable users to:

- Find guesthouse information in one organised platform.

- Search for guesthouses by name or location.

- Compare available guesthouses using price, ratings, amenities and
  location information.

- View guesthouse images and descriptions before deciding which options
  interest them.

- Browse listings without the inconvenience of mandatory registration.

- Save preferred guesthouses for later reference after logging in.

- Submit ratings after authenticating.

- Allow authorised administrators to maintain accurate guesthouse
  information.

- Allow administrators to understand basic listing distribution through
  dashboard statistics.

- Access information that reflects the latest successfully stored
  listing changes.

## 1.5 Intended Audience

This document is intended for:

- Project developers and designers.

- Project testers.

- Project team members responsible for coordinating features.

- The project supervisor or lecturer.

- People evaluating the usability and completeness of the proposed
  system.

- Future maintainers who need to understand the intended user
  experience.

## 1.6 Definitions

| **Term**            | **Definition**                                                                |
|---------------------|-------------------------------------------------------------------------------|
| User requirement    | A statement describing something a user needs the system to support           |
| Stakeholder         | A person or group affected by the system                                      |
| Administrator       | An authorised person responsible for managing guesthouse listings             |
| Customer            | A person using the platform to discover guesthouses                           |
| Registered customer | A customer who has created an account and authenticated                       |
| Guesthouse listing  | Information about a guesthouse displayed through the platform                 |
| Favourite           | A guesthouse saved by a registered customer                                   |
| Rating              | A numerical evaluation submitted by an authenticated customer                 |
| User story          | A concise description of a feature from the user's perspective                |
| User scenario       | A description of how a user may interact with the system to achieve a goal    |
| Acceptance criteria | Conditions that must be satisfied for a user requirement to be considered met |
| UI                  | User Interface                                                                |
| UX                  | User Experience                                                               |

# 2. Background and User Problem

## 2.1 Background

Customers looking for guesthouse accommodation may encounter information
spread across different websites, social media platforms and other
sources. This can make it inconvenient to find relevant details and
compare available options.

For example, a customer may find a guesthouse's contact details on one
platform, images on another and pricing information somewhere else.
Comparing several guesthouses may require repeatedly switching between
sources.

Administrators also need a convenient way to manage guesthouse
information. Without a centralised listing management interface, keeping
names, images, prices, descriptions and contact information up to date
may be difficult.

Lala is intended to address these problems by bringing guesthouse
discovery and listing management into one platform.

## 2.2 Problem Statement

Customers need a convenient way to discover and compare guesthouses
using relevant information such as location, price, amenities, images
and ratings. Administrators need a centralised interface for creating,
updating and maintaining guesthouse listings.

The absence of a single, organised discovery and management platform can
make accommodation research less convenient and guesthouse information
more difficult to maintain consistently.

Lala will provide a mobile customer experience for discovering
guesthouses and a web-based administrative experience for managing the
information presented to customers.

## 2.3 User Problems and Proposed Solutions

| **User Problem**                                               | **User Need**                             | **Proposed Lala Solution**                                      |
|----------------------------------------------------------------|-------------------------------------------|-----------------------------------------------------------------|
| Guesthouse information is distributed across different sources | A central place to discover guesthouses   | A mobile application displaying guesthouse listings             |
| Finding a particular guesthouse takes time                     | A simple search facility                  | Search by guesthouse name or location                           |
| Comparing accommodation prices is inconvenient                 | A way to compare options by price         | Price information, filtering and cheapest-first default sorting |
| Customers need to assess guesthouses before contacting them    | Access to useful listing information      | Images, descriptions, amenities, location, price and ratings    |
| Customers may want to keep track of preferred guesthouses      | A way to save interesting listings        | A favourites feature for registered customers                   |
| Customers want to provide feedback about guesthouses           | A way to submit ratings                   | An authenticated rating feature                                 |
| Administrators need to maintain guesthouse information         | A centralised management interface        | A web-based Admin Portal                                        |
| Administrators need an overview of listing information         | A summary of important listing statistics | An administrative dashboard                                     |
| Users may encounter missing data or service errors             | Clear feedback and predictable behaviour  | Loading indicators, empty states, validation and error messages |

## 2.4 Expected Benefits to Users

The expected benefits include:

1.  **Convenience:** Customers can access multiple guesthouse listings
    through one application.

2.  **Improved comparison:** Customers can use prices, ratings,
    amenities and locations to evaluate available options.

3.  **Reduced search effort:** Name and location search help customers
    find relevant listings.

4.  **Personal organisation:** Registered customers can save favourites
    for later reference.

5.  **User participation:** Registered customers can submit guesthouse
    ratings.

6.  **Simplified administration:** Administrators can manage listings
    through a centralised web interface.

7.  **Improved visibility:** Guesthouses can be presented with
    structured information and images.

8.  **Better administrative overview:** Dashboard statistics help
    administrators understand the distribution and ratings of listings.

These are intended benefits. Their actual impact would need to be
evaluated through user testing or market research rather than assumed to
have been proven.

# 3. Stakeholders and User Groups

## 3.1 Stakeholders

| **Stakeholder**                | **Interest in the System**                | **Expected Benefit**                                     |
|--------------------------------|-------------------------------------------|----------------------------------------------------------|
| Customers                      | Discovering and comparing guesthouses     | Easier access to organised guesthouse information        |
| Registered customers           | Saving favourites and submitting ratings  | A more personalised discovery experience                 |
| Administrators                 | Managing guesthouse records               | Centralised listing management and dashboard information |
| Project development team       | Building and maintaining the applications | Clear user needs to guide development                    |
| Project supervisor or lecturer | Evaluating the project                    | Evidence that the system addresses its stated objectives |
| Guesthouse businesses          | Being represented through listings        | Greater visibility to people using the platform          |

Guesthouse businesses are beneficiaries of the platform but are not
direct system users under the current scope. The platform does not
provide separate guesthouse-owner accounts.

## 3.2 User Group A: Administrators

Administrators are responsible for maintaining guesthouse information
and overseeing the listings available on the platform.

Their primary goals are to:

- Access the administrative interface securely.

- Register guesthouses with complete information.

- Upload or select appropriate guesthouse images.

- Update inaccurate or outdated listing details.

- Remove listings that should no longer appear.

- View key dashboard statistics.

- Manage additional administrator accounts where authorised.

**Administrator Needs**

| **ID** | **Administrator Need**                                              | **Importance** |
|--------|---------------------------------------------------------------------|----------------|
| AN-01  | Log in to the Admin Portal securely                                 | Must           |
| AN-02  | Register guesthouses through a structured form                      | Must           |
| AN-03  | Add a logo or primary image and gallery images                      | Must           |
| AN-04  | Enter price, amenities, location and contact details                | Must           |
| AN-05  | Correct existing listing information                                | Must           |
| AN-06  | Delete an existing listing                                          | Must           |
| AN-07  | View the total number of guesthouses                                | Must           |
| AN-08  | Identify the city with the most guesthouse listings                 | Must           |
| AN-09  | Identify the highest-rated guesthouse using the agreed rating rules | Must           |
| AN-10  | Receive understandable validation and error messages                | Must           |
| AN-11  | Create additional administrator accounts where authorised           | Must           |
| AN-12  | Know whether listing changes were saved successfully                | Must           |

## 3.3 User Group B: Customers

Customers are people who want to discover guesthouses and compare the
information available through the platform.

They may be browsing casually or researching accommodation options. The
system must not assume that every customer is ready to book or that
every customer wants to create an account.

Their primary goals are to:

- Browse guesthouses without registering.

- Find guesthouses by name or location.

- Compare prices and ratings.

- View guesthouse images and descriptions.

- Review amenities and contact information.

- Identify options that fit their preferences.

- Receive useful feedback when no results are found.

**Customer Needs**

| **ID** | **Customer Need**                             | **Importance** |
|--------|-----------------------------------------------|----------------|
| CN-01  | Browse listings without creating an account   | Must           |
| CN-02  | View guesthouse details                       | Must           |
| CN-03  | Search by guesthouse name                     | Must           |
| CN-04  | Search by location                            | Must           |
| CN-05  | Filter listings by price                      | Must           |
| CN-06  | Filter listings by rating                     | Must           |
| CN-07  | See the cheapest guesthouses first by default | Must           |
| CN-08  | View available images and amenities           | Must           |
| CN-09  | View available guesthouse contact information | Must           |
| CN-10  | Receive clear feedback when no results match  | Must           |
| CN-11  | Understand when information cannot be loaded  | Must           |

## 3.4 User Group C: Registered Customers

Registered customers can access the same public discovery features as
other customers, with additional account-dependent functionality.

Their goals are to:

- Create an account and log in.

- Save interesting guesthouses as favourites.

- Access their saved favourites later.

- Remove guesthouses from their favourites.

- Submit numerical ratings.

- Receive feedback when an account-dependent operation succeeds or
  fails.

**Registered Customer Needs**

| **ID** | **Registered Customer Need**                                      | **Importance** |
|--------|-------------------------------------------------------------------|----------------|
| RN-01  | Create a customer account                                         | Must           |
| RN-02  | Log in to an existing account                                     | Must           |
| RN-03  | Save a guesthouse as a favourite                                  | Must           |
| RN-04  | View saved favourites                                             | Must           |
| RN-05  | Remove a saved favourite                                          | Must           |
| RN-06  | Submit a guesthouse rating                                        | Must           |
| RN-07  | Receive feedback about unsuccessful account actions               | Must           |
| RN-08  | Have account-specific actions associated with the correct account | Must           |

# 4. User Needs and Expectations

## 4.1 General Expectations

Users should be able to understand the purpose of each application
without needing technical knowledge.

The platform should:

- Use clear labels and familiar navigation.

- Present guesthouse information in a consistent format.

- Make the main functions easy to locate.

- Explain why an action cannot be completed.

- Avoid requiring registration for ordinary browsing.

- Protect account-specific and administrative functions.

- Make important listing information easy to read.

- Handle empty results and service failures in a helpful manner.

## 4.2 Guesthouse Information Needs

Customers should be able to access the information available for a
listing, including:

| **Information**                         | **Why It Matters to Customers**                             |
|-----------------------------------------|-------------------------------------------------------------|
| Guesthouse name                         | Identifies the accommodation                                |
| Logo or primary image                   | Helps visually identify the listing                         |
| Image gallery                           | Allows customers to inspect available images                |
| Description                             | Explains the guesthouse and its features                    |
| Amenities                               | Helps customers compare available facilities                |
| GPS coordinates or location information | Helps customers understand where the guesthouse is situated |
| City and country                        | Supports location-based discovery                           |
| Price per night                         | Supports price comparison                                   |
| Contact details                         | Allows customers to seek further information directly       |
| Rating information                      | Helps customers compare guesthouse evaluations              |

The platform must distinguish between information that is available and
information that has not been supplied. It should not invent missing
prices, amenities, images or ratings.

## 4.3 Search and Discovery Expectations

Customers should be able to narrow the displayed listings without
navigating away from the main discovery experience.

The system should support:

- Searching by guesthouse name.

- Searching by location.

- Filtering by price.

- Filtering by rating.

- Displaying the lowest-priced guesthouses first by default.

- Viewing the details of a selected guesthouse.

- Receiving a clear message when no matching results exist.

The precise behaviour of rating filters, including the treatment of
unrated guesthouses, must be consistent with the final rules agreed by
the project team.

## 4.4 Account and Personalisation Expectations

Public browsing should remain available to all customers. Creating an
account should be necessary only when the customer wishes to use
features that depend on an individual account.

The system should make the distinction between public and
account-dependent functionality clear.

| **Feature**                | **Account Required?**               |
|----------------------------|-------------------------------------|
| Browse guesthouses         | No                                  |
| Search by name or location | No                                  |
| Filter by price or rating  | No                                  |
| View guesthouse details    | No                                  |
| Register or log in         | Relevant only when using an account |
| Save favourites            | Yes                                 |
| View personal favourites   | Yes                                 |
| Submit a rating            | Yes                                 |

## 4.5 Administrator Expectations

Administrators should be able to manage listings without unnecessarily
complicated workflows.

The registration form should group related information logically, such
as:

1.  Basic guesthouse information.

2.  Location information.

3.  Price and amenities.

4.  Images.

5.  Contact details.

The form should clearly indicate required fields, identify invalid
values and explain whether a listing has been saved successfully.

Administrators should also be able to recognise the purpose of each
dashboard statistic without needing to calculate the figures manually.

# 5. User Requirements

The following requirements describe the capabilities users expect from
the system. The identifiers can be used in design reviews and user
acceptance testing.

## 5.1 Administrator Requirements

| **ID**    | **User Requirement**                                                                                                                                    | **Expected Outcome**                                                 |
|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------|
| UR-ADM-01 | As an administrator, I want to log in securely so that only authorised users can access administrative functions.                                       | Unauthorised users cannot access protected functions.                |
| UR-ADM-02 | As an administrator, I want to register a guesthouse so that it can appear in the customer application.                                                 | A valid listing is saved and becomes available for retrieval.        |
| UR-ADM-03 | As an administrator, I want to add guesthouse images so that customers can see the accommodation visually.                                              | Stored images are displayed in the relevant listing.                 |
| UR-ADM-04 | As an administrator, I want to record prices and amenities so that customers can make informed comparisons.                                             | Listing details are stored and displayed correctly.                  |
| UR-ADM-05 | As an administrator, I want to record location and contact information so that customers can understand where the guesthouse is and how to contact it.  | The saved information is available in the listing details.           |
| UR-ADM-06 | As an administrator, I want to update listing details so that inaccurate or outdated information can be corrected.                                      | Changes are saved and can be retrieved.                              |
| UR-ADM-07 | As an administrator, I want to delete a listing so that unwanted records can be removed.                                                                | The deleted listing is no longer available as an active listing.     |
| UR-ADM-08 | As an administrator, I want to see the total number of guesthouses so that I can understand the size of the platform's listing collection.              | The dashboard displays the correct count.                            |
| UR-ADM-09 | As an administrator, I want to see which city has the most guesthouses so that I can understand the distribution of listings.                           | The dashboard identifies the city with the highest listing count.    |
| UR-ADM-10 | As an administrator, I want to see the highest-rated guesthouse so that I can understand which listing has the strongest rating under the agreed rules. | The dashboard identifies the correct eligible listing.               |
| UR-ADM-11 | As an administrator, I want to receive clear feedback when an operation fails so that I can correct problems or retry the operation.                    | Errors are communicated without false success messages.              |
| UR-ADM-12 | As an authorised administrator, I want to create additional administrator accounts so that administrative responsibilities can be shared.               | Additional authorised administrators can access permitted functions. |

## 5.2 Customer Requirements

| **ID**    | **User Requirement**                                                                                                                                  | **Expected Outcome**                                                |
|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| UR-CUS-01 | As a customer, I want to browse guesthouses without registering so that I can explore the platform before creating an account.                        | Listings are accessible without customer authentication.            |
| UR-CUS-02 | As a customer, I want to search by guesthouse name so that I can find a particular guesthouse.                                                        | Relevant matching listings are displayed.                           |
| UR-CUS-03 | As a customer, I want to search by location so that I can find guesthouses in a particular area.                                                      | Listings matching the location criteria are displayed.              |
| UR-CUS-04 | As a customer, I want to filter guesthouses by price so that I can focus on accommodation within my preferred price range.                            | Only listings satisfying the selected price criteria are displayed. |
| UR-CUS-05 | As a customer, I want to filter by rating so that I can compare listings according to available customer evaluations.                                 | Listings follow the agreed rating-filter rules.                     |
| UR-CUS-06 | As a customer, I want the cheapest guesthouses to appear first by default so that lower-priced options are easy to identify.                          | The default order is from lowest price to highest price.            |
| UR-CUS-07 | As a customer, I want to view images and descriptions so that I can learn about a guesthouse before contacting it.                                    | Available listing information is presented clearly.                 |
| UR-CUS-08 | As a customer, I want to see amenities so that I can compare the facilities offered by different guesthouses.                                         | Available amenities are displayed in the listing details.           |
| UR-CUS-09 | As a customer, I want to view contact details so that I can contact the guesthouse directly if necessary.                                             | Available contact information is visible.                           |
| UR-CUS-10 | As a customer, I want to know when no results match my search so that I can adjust my search criteria.                                                | The system displays a clear no-results message.                     |
| UR-CUS-11 | As a customer, I want to know when information cannot be loaded so that I understand that the problem is not necessarily an empty listing collection. | The system displays an appropriate error or retry message.          |

## 5.3 Registered Customer Requirements

| **ID**    | **User Requirement**                                                                                                                                              | **Expected Outcome**                                                              |
|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| UR-REG-01 | As a customer, I want to create an account so that I can use personalised features.                                                                               | A valid account can be created.                                                   |
| UR-REG-02 | As a registered customer, I want to log in so that I can access my account-dependent features.                                                                    | Successful authentication grants access to permitted features.                    |
| UR-REG-03 | As a registered customer, I want to save a guesthouse as a favourite so that I can find it later.                                                                 | The guesthouse appears in my saved favourites.                                    |
| UR-REG-04 | As a registered customer, I want to view my favourites so that I can revisit guesthouses that interest me.                                                        | The system displays the customer's saved guesthouses.                             |
| UR-REG-05 | As a registered customer, I want to remove a favourite so that I can keep my saved list relevant.                                                                 | The selected guesthouse is removed from the customer's favourites.                |
| UR-REG-06 | As a registered customer, I want to rate a guesthouse so that I can contribute an evaluation of it.                                                               | A valid rating is stored and associated with the correct customer and guesthouse. |
| UR-REG-07 | As a registered customer, I want to know whether my rating was submitted successfully so that I do not mistakenly assume an unsuccessful submission was recorded. | The system provides accurate confirmation or error feedback.                      |

# 6. User Stories and Use Scenarios

## 6.1 Scenario A: An Administrator Registers a Guesthouse

**User:** Administrator

**Goal:** Add a guesthouse to the platform.

**Scenario:**

1.  The administrator opens the Admin Portal.

2.  The administrator enters their login credentials.

3.  The system verifies that the account is authorised.

4.  The administrator opens the guesthouse management section.

5.  The administrator selects the option to register a guesthouse.

6.  The administrator enters the guesthouse name, description,
    amenities, price, location and contact details.

7.  The administrator adds the required images.

8.  The administrator submits the form.

9.  The system validates the information.

10. The system saves the guesthouse record and relevant image
    references.

11. The system confirms that the listing was saved.

12. The listing becomes available to the Customer Application after the
    data is successfully retrieved or refreshed.

**Expected outcome:** The administrator can create a valid listing
without needing to edit database records manually.

<img src="/mnt/data/SOUR_media/media/image3.png"
style="width:1.90216in;height:3.8in" />

*Figure 2. Administrator Workflow for Registering a Guesthouse.*

*Figure 1. Lala Guesthouse Platform System Context Diagram.*

<img src="/mnt/data/SOUR_media/media/image4.png"
style="width:6.05986in;height:3.8in" />

## 6.2 Scenario B: A Customer Discovers a Guesthouse

**User:** Customer

**Goal:** Find and inspect guesthouses without registering.

**Scenario:**

1.  The customer opens the mobile application.

2.  The application displays available guesthouse listings.

3.  The cheapest listings appear first by default.

4.  The customer searches by a guesthouse name or location, or browses
    the available listings.

5.  The customer applies a price or rating filter if necessary.

6.  The application displays the matching results.

7.  The customer selects a guesthouse.

8.  The application displays available images, descriptions, amenities,
    price, location and contact information.

**Expected outcome:** The customer can discover and compare guesthouses
without creating an account.

<img src="/mnt/data/SOUR_media/media/image5.png"
style="width:2.6662in;height:3.8in" />

*Figure 3. Customer Guesthouse Discovery Journey.*

## 6.3 Scenario C: A Customer Saves a Favourite

**User:** Registered Customer

**Goal:** Keep a guesthouse for later reference.

**Scenario:**

1.  The customer browses guesthouse listings.

2.  The customer identifies a guesthouse of interest.

3.  The customer selects the favourite control.

4.  If the customer is not authenticated, the system requests login.

5.  The customer logs in or creates an account.

6.  The customer completes the favourite action.

7.  The system stores the favourite against the customer's account.

8.  The customer opens the favourites section later to view saved
    guesthouses.

**Expected outcome:** Authenticated customers can maintain a personal
collection of guesthouses they are interested in.

## 6.4 Scenario D: A Customer Submits a Rating

**User:** Registered Customer

**Goal:** Submit a guesthouse rating.

**Scenario:**

1.  The customer opens a guesthouse listing.

2.  The customer selects the rating control.

3.  The customer chooses a value from the agreed numerical scale.

4.  The customer submits the rating.

5.  The system validates the value and verifies the customer's
    authentication.

6.  The system saves the rating.

7.  The system confirms the outcome.

**Expected outcome:** A valid rating is stored and can be used by the
system's rating-related displays and statistics.

The team must decide whether customers can submit a rating more than
once for the same guesthouse and whether an existing rating can be
edited.

## 6.5 Scenario E: An Administrator Reviews Dashboard Statistics

**User:** Administrator

**Goal:** Understand the current distribution and ratings of guesthouse
listings.

**Scenario:**

1.  The administrator logs in.

2.  The administrator opens the dashboard.

3.  The system displays the total number of guesthouses.

4.  The system identifies the city with the most listings.

5.  The system identifies the highest-rated eligible guesthouse using
    the agreed rating calculation.

6.  If the database contains no listings or no eligible ratings, the
    system displays appropriate empty-state information.

**Expected outcome:** The administrator can review the required
statistics without manually counting listings or calculating ratings.

# 7. User Interaction and Navigation Requirements

## 7.1 Admin Portal Navigation

The Admin Portal should provide a clear path to the main administrative
tasks.

A proposed navigation structure is:

- Login

- Dashboard

- Guesthouse Listings

- Add Guesthouse

- Edit Guesthouse

- Administrator Account Management, where authorised

- Logout

The final navigation labels and arrangement may change during UI design,
but all required administrative capabilities must remain accessible to
authorised administrators.

## 7.2 Customer Application Navigation

The mobile Customer Application should support the following main
activities:

- Browse guesthouses.

- Search for guesthouses.

- Apply price and rating filters.

- View guesthouse details.

- Register or log in.

- View saved favourites after authentication.

- Save or remove favourites after authentication.

- Submit ratings after authentication.

The discovery experience should remain accessible without login. Users
should not be forced to create an account merely to view ordinary
guesthouse listings.

<img src="/mnt/data/SOUR_media/media/image6.png"
style="width:2.9987in;height:3.8in" />

*Figure 4. Proposed Lala Platform Navigation Structure.*

## 7.3 Form Interaction

The guesthouse registration and editing forms should:

- Group related fields together.

- Identify required fields clearly.

- Use suitable input types for prices and coordinates.

- Provide understandable validation messages.

- Preserve entered values where practical when validation fails.

- Provide clear save and cancel actions.

- Display success feedback only after a successful operation.

- Warn administrators before destructive actions such as deleting a
  listing.

## 7.4 Search and Filter Interaction

Customers should be able to understand which search and filter criteria
are active.

The interface should make it straightforward to revise or clear search
criteria. When no results match the selected criteria, the application
should explain that no matches were found rather than displaying a blank
screen without context.

The default sort order must remain lowest price first. Any additional
sorting options must be clearly labelled and should not make the default
behaviour confusing.

## 7.5 Error and Empty States

The system should communicate the difference between:

- No guesthouses being available.

- No guesthouses matching a search.

- Guesthouse information failing to load.

- A form containing invalid information.

- A save or update operation failing.

- A customer needing to log in to use a protected feature.

These situations should not all produce the same generic message because
they require different user responses.

# 8. Usability and Accessibility Requirements

## 8.1 Ease of Use

The interface should be understandable to users who are unfamiliar with
the platform.

Users should be able to identify the primary actions, understand the
information displayed and recover from common mistakes without requiring
technical assistance.

| **ID** | **User Experience Requirement**                                             | **Expected Outcome**                                       |
|--------|-----------------------------------------------------------------------------|------------------------------------------------------------|
| UX-01  | Navigation labels should be clear and descriptive.                          | Users can identify the purpose of each section.            |
| UX-02  | Important guesthouse information should be presented consistently.          | Customers can compare listings more easily.                |
| UX-03  | Required form fields should be clearly identified.                          | Administrators know what information must be provided.     |
| UX-04  | Validation errors should explain how to correct the problem.                | Administrators can fix invalid entries.                    |
| UX-05  | Success and failure messages should be distinguishable.                     | Users know whether an action was completed.                |
| UX-06  | Empty results should have explanatory messages.                             | Customers know when to adjust their search.                |
| UX-07  | The customer browsing experience should not require registration.           | Customers can explore listings immediately.                |
| UX-08  | Account-dependent actions should communicate when login is required.        | Customers understand why authentication is necessary.      |
| UX-09  | Destructive actions should be clearly labelled and appropriately confirmed. | Users are less likely to delete listings accidentally.     |
| UX-10  | Interfaces should remain usable at supported screen sizes.                  | Users can access important functions on supported devices. |

## 8.2 Visual Presentation

The visual design should support the platform's hospitality and
accommodation focus. Guesthouse photography, prices, location details
and amenities should be presented in a way that makes listings easy to
scan and compare.

## 8.3 Accessibility Considerations

The platform should follow basic accessibility practices:

- Use readable text sizes and sufficient contrast.

- Provide labels for form inputs.

- Use descriptive button and navigation labels.

- Avoid relying only on colour to indicate an error or success.

- Ensure that important controls have clear visual states.

- Provide appropriate text alternatives for meaningful images where
  supported.

- Avoid layouts that make important content difficult to access on
  supported screens.

These requirements should be evaluated through interface inspection and
user testing where possible.

# 9. User Acceptance Criteria

The following criteria can be used to determine whether the platform
satisfies the principal user needs.

| **Test ID** | **User Goal**                       | **Acceptance Criteria**                                                                                             | **Priority** |
|-------------|-------------------------------------|---------------------------------------------------------------------------------------------------------------------|--------------|
| UAT-01      | Browse guesthouses                  | A customer can view available listings without registering.                                                         | Must         |
| UAT-02      | Inspect a listing                   | A customer can open a listing and view the available guesthouse details.                                            | Must         |
| UAT-03      | Search for a guesthouse             | A customer can search by name and location.                                                                         | Must         |
| UAT-04      | Compare prices                      | A customer can apply price filters and see the cheapest listing first by default.                                   | Must         |
| UAT-05      | Filter by rating                    | A customer can filter listings according to the agreed rating rules.                                                | Must         |
| UAT-06      | Register a guesthouse               | An authorised administrator can submit valid listing information and receive confirmation when it is saved.         | Must         |
| UAT-07      | Correct listing information         | An authorised administrator can update an existing listing and retrieve the updated information.                    | Must         |
| UAT-08      | Remove a listing                    | An authorised administrator can delete a listing through the administrative interface.                              | Must         |
| UAT-09      | View statistics                     | An administrator can view the required dashboard statistics and appropriate empty states.                           | Must         |
| UAT-10      | Save favourites                     | An authenticated customer can save a guesthouse and view it in the favourites section.                              | Must         |
| UAT-11      | Submit a rating                     | An authenticated customer can submit a valid rating and receive accurate feedback.                                  | Must         |
| UAT-12      | Prevent unauthorised administration | A customer or unauthorised user cannot perform protected administrative actions.                                    | Must         |
| UAT-13      | Handle invalid input                | Invalid form entries are identified and the user receives useful feedback.                                          | Must         |
| UAT-14      | Handle empty search results         | The system explains when no listings match the customer's criteria.                                                 | Must         |
| UAT-15      | Handle service failures             | The system communicates unsuccessful operations without falsely reporting success.                                  | Must         |
| UAT-16      | Keep information consistent         | A successfully saved listing can be retrieved by the other application after its data is refreshed or synchronised. | Must         |

## 9.1 User Evaluation

Where practical, the project team should ask representative users to
complete tasks such as finding a guesthouse, applying a price filter,
registering a listing and saving a favourite.

Feedback should be used to identify:

- Confusing navigation.

- Missing information.

- Unclear form labels.

- Difficult search or filtering interactions.

- Unhelpful error messages.

- Problems viewing the interface on supported devices.

If user testing is conducted, the team should record the tasks,
observations, issues identified and improvements made. The report should
distinguish actual findings from assumptions about what users might
prefer.

# 10. Scope Boundaries and User Limitations

## 10.1 Included User Capabilities

The platform is intended to support:

- Guesthouse discovery and listing viewing.

- Search by guesthouse name or location.

- Filtering by price and rating.

- Cheapest-first default sorting in the mobile application.

- Guesthouse registration and management by authorised administrators.

- Administrative dashboard statistics.

- Customer registration and login.

- Favourites for authenticated customers.

- Ratings for authenticated customers.

- Access to available guesthouse images, amenities, prices, locations
  and contact details.

## 10.2 Excluded User Capabilities

The following are outside the approved project scope:

| **Excluded Capability**         | **Reason**                                                                  |
|---------------------------------|-----------------------------------------------------------------------------|
| Booking or reservations         | The platform focuses on discovery, not booking management.                  |
| Payment processing              | Financial transactions are not part of the required system.                 |
| Direct messaging                | Messaging between customers and guesthouse representatives is not included. |
| Guesthouse-owner accounts       | Listing management is handled by authorised administrators.                 |
| Availability calendars          | Availability management is outside the current scope.                       |
| Check-in/check-out scheduling   | The system does not manage accommodation stays.                             |
| Push notifications              | Not included among the required features.                                   |
| Social login                    | Not required by the agreed scope.                                           |
| Unapproved additional features  | Changes must be reviewed against the agreed project scope.                  |
| Mandatory production deployment | Required only if specified by the lecturer or approved as a stretch goal.   |

## 10.3 Known Limitations

The system's usefulness depends on the completeness and accuracy of
guesthouse information entered by administrators.

Customers may be unable to compare listings fully when information such
as prices, amenities, images or ratings is missing. The platform should
display available information accurately without implying that missing
information has been verified.

The platform is not intended to confirm room availability, secure
reservations, process payments or guarantee the quality of a guesthouse.
Customers may need to contact a guesthouse directly for further
information.

# 11. Requirements Prioritisation

The requirements should be implemented in an order that protects the
essential purpose of the platform.

| **Priority** | **Meaning**                                                                            | **Examples**                                                                                                               |
|--------------|----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Must         | Essential for satisfying the agreed project scope                                      | Public browsing, listing management, search, price filtering, authentication, favourites, ratings and dashboard statistics |
| Should       | Important for a polished and usable experience, but subject to implementation planning | Helpful confirmations, improved error handling and additional usability refinements                                        |
| Could        | Optional enhancement if time and resources permit and the feature is approved          | Additional convenience features that do not conflict with the agreed scope                                                 |

The categories above are a planning guide. The project team should not
treat optional enhancements as mandatory requirements unless the scope
is formally updated.

## 11.1 Recommended Implementation Order

1.  Establish the main browsing and listing-management interfaces.

2.  Implement guesthouse registration, viewing, editing and deletion.

3.  Implement the shared data model and connect both applications.

4.  Implement public browsing, search, filtering and cheapest-first
    sorting.

5.  Implement administrator authentication and access restrictions.

6.  Implement customer registration and login.

7.  Implement favourites and ratings.

8.  Implement and verify dashboard statistics.

9.  Test loading, empty, error and validation states.

10. Conduct user acceptance testing and prepare the supporting
    documentation.

This order is a proposed development sequence, not a requirement to
implement features in that exact order.

# Appendices

## Appendix A. Requirements Traceability Summary

This appendix links the principal user groups to the requirement
identifiers and acceptance criteria already defined in this document. It
is intended to support design reviews and user acceptance testing.

| User group          | Need / requirement range         | Related UAT                                 | Purpose                                                                                |
|---------------------|----------------------------------|---------------------------------------------|----------------------------------------------------------------------------------------|
| Administrator       | AN-01–AN-12; UR-ADM-01–UR-ADM-12 | UAT-06–UAT-09, UAT-12–UAT-13, UAT-15–UAT-16 | Secure administration, listing management, dashboard statistics and reliable feedback. |
| Customer            | CN-01–CN-11; UR-CUS-01–UR-CUS-11 | UAT-01–UAT-05, UAT-14–UAT-16                | Public discovery, search, filtering, listing details and error/empty states.           |
| Registered customer | RN-01–RN-08; UR-REG-01–UR-REG-07 | UAT-10–UAT-11, UAT-15–UAT-16                | Authentication, favourites, ratings and account-specific feedback.                     |

## Appendix B. User Evaluation Record Template

This template can be used if representative-user testing is conducted,
as recommended in Section 9.1. Record observed results rather than
assumed user preferences.

| Test / task                            | User type           | Expected outcome                                                        | Observed result | Issue identified | Improvement / action |
|----------------------------------------|---------------------|-------------------------------------------------------------------------|-----------------|------------------|----------------------|
| Browse and inspect a guesthouse        | Customer            | Listings and available details can be viewed without registration.      |                 |                  |                      |
| Search and apply a price/rating filter | Customer            | Matching listings are shown; no-results state is clear when applicable. |                 |                  |                      |
| Register or update a guesthouse        | Administrator       | Valid information is saved and confirmation is accurate.                |                 |                  |                      |
| Save a favourite                       | Registered customer | Selected guesthouse appears in the correct customer favourites.         |                 |                  |                      |
| Submit a rating                        | Registered customer | Valid rating is stored and accurate feedback is shown.                  |                 |                  |                      |

## Appendix C. Figure List

• Figure 1. Lala Guesthouse Platform System Context Diagram.

• Figure 2. Administrator Workflow for Registering a Guesthouse.

• Figure 3. Customer Guesthouse Discovery Journey.

• Figure 4. Proposed Lala Platform Navigation Structure.
