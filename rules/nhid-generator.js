/*
 * Based on OpenIZ, Copyright (C) 2015 - 2019 Mohawk College of Applied Arts and Technology
 * Copyright (C) 2019 - 2020, Fyfe Software Inc. and the SanteSuite Contributors (See NOTICE.md)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you 
 * may not use this file except in compliance with the License. You may 
 * obtain a copy of the License at 
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations under 
 * the License.
 * 
 * User: fyfej
 * Date: 2019-11-27
 */

 /** 
  * @fileoverview Illustrates several common business rule triggers 
  * @see https://help.santesuite.org/santedb/extending-santedb/applets/assets/html-widgets
  * @summary This file is picked up by the iCDR and dCDR and registers triggers for patient insertion and patient master insertion.
  */
 /// <reference path="../.ref/js/santedb-bre.js" />
/// <reference path="../.ref/js/santedb-model.js" />
/// <reference path="../.ref/js/santedb.js" />

/**
 * Elbonia National MPI SanteMPI Business Rules for National Health Identifier Generation
 * --
 */

function generateElboniaNhid() {

    var source = SanteDBBre.NewGuid().replace(/[a-zA-Z\-]/ig, '').substring(0, 10);
    source = source.pad('0', 10);
    var key = "0123456789";
    var seed = ("0" + source).split('').map(function (c) { return key.indexOf(c); }).reduce(function (a, v, i) { return ((a + v) * 10) % 97; });
    seed *= 10; seed %= 97;
    var checkDigit = (97 - seed + 1) % 97;
    checkDigit += "";

    var retVal = source + checkDigit.pad('0', 2);
    return retVal;
};


/**
 * Business rule - when incoming patient master has been persisted not in MDM mode
 */
function appendPatientID(patient) {

    if (!patient.identifier)
        patient.identifier = {};

    // If operating in a server environment
    if (SanteDBBre.Environment == ExecutionEnvironment.Server) {
        // Append NHID only if the service is a mdm.type = M (master)
        if (!patient.identifier.MOH_NHID)
            patient.identifier.MOH_NHID = { value: generateElboniaNhid() };
    }
    else {
        
        // Append App ID
        if (!patient.identifier.MOH_MPI_TMP )
            patient.identifier.MOH_MPI_TMP = { value: generateElboniaNhid() };
        // else if (SanteDBBre.Environment == ExecutionEnvironment.Mobile && !patient.identifier.MOH_GEN_NHID_MPI_REG )
        //     patient.identifier.MOH_GEN_NHID_MPI_REG = { value: generateElboniaNhid() };

        // Prepare relationship
        try {
            if (!patient.relationship)
                patient.relationship = {};

            // Set the dedicated registration facility
            var facility = SanteDBDcg.GetFacilities().resource[0];
            patient.relationship.ServiceDeliveryLocation = new EntityRelationship({
                target: facility.id
            });
        }
        catch (e) {
            console.error("Error assigning facility: " + e);
        }
    }

    return patient;
};

/**
 * Checks if the person is being upgraded to patient
 * @param {Person} person The person to check for upgrade
 */
function checkUpgradeToPatient(person) {

    if(person.tag && person.tag["$sys.reclass"] == "true" && person.classConcept == EntityClassKeys.Patient) {
        console.info("Person " + person.id + " is being re-classed - Will assign NHID");
        return appendPatientID(person); // Generate NHID or local
    }
    return person;
}


// Bind the business rules
try {
    // Server with MDM will have PatientMaster objects
    SanteDBBre.AddBusinessRule("PatientMaster", "BeforeInsert", { "deceasedDate": "null" }, appendPatientID);
}
catch (e) {
    console.warn("" + e);
    SanteDBBre.AddBusinessRule("Patient", "BeforeInsert", { "deceasedDate": "null" }, appendPatientID);
}

SanteDBBre.AddBusinessRule("Person", "BeforeUpdate", {}, checkUpgradeToPatient);

// Add identifier generators
if(SanteDB.application) {
    SanteDB.application.addIdentifierGenerator("MOH_NHID", generateElboniaNhid);
    SanteDB.application.addIdentifierGenerator("MOH_MPI_TMP", generateElboniaNhid);
}